import axios from "axios";
import { CaptainModel } from "../models/captain-model.js";
import { DeliveryModel } from "../models/delivery-model.js";
import { RideModel } from "../models/ride-schema.js";
import { asyncHandler } from "../utils/Asynchandler.js";
import { sendMessage } from "../utils/GlobalSocket.js";
import { getLatLng } from "../utils/MapServices.js";
import { calcFare, calcFine, generateOtp, getNearbyCaptains } from "../utils/RideServices.js";
import { validationResult } from "express-validator";




export const createRide=asyncHandler(async (req,res) => {
   const  validationErr=validationResult(req)
   if(!validationErr.isEmpty()){
   return res.status(400) 
    .json({
        error:validationErr.array()
    })
   }
   
    const {
        pickUp,
        drop,
        vehicleType
    }=req.body
    const user=req.user
    if(!pickUp || !drop || !vehicleType){
        throw new Error('Provide all information')
    }
  
    const fareDetails = await calcFare(pickUp, drop);
    const { fares } = fareDetails; // Ensure fares is used (not fare directly)
    const{ distanceInKm}=fareDetails 
    const {durationInMins}=fareDetails
    const otp=generateOtp(6)
  
  
  
    //FIrst getting the latitudes and longitudes from pickup 
    const getPickup=await getLatLng(pickUp)
   
    const nearbyCaptains=await getNearbyCaptains(getPickup.latitude,getPickup.longitude,2)

 


    const newRide = await RideModel.create({
        User: req.user._id,
        pickup: pickUp,
        destination: drop,
        vehicleType,
        duration:durationInMins,
        distance:distanceInKm,
        otp:otp,
        fare: fares[vehicleType], // Note: Use `fares` instead of `fare` here
    });
    const newRidewithUser=await RideModel.findOne({_id:newRide._id}).populate('User')
    newRide.otp=""
    nearbyCaptains.map(captain=>
        sendMessage(captain.socketId,{
            event:'new-ride',
            data:newRidewithUser
        })   
    )
    return res.status(200).json(
        {
            message:"Ride Created",
            newRidewithUser,
            nearbyCaptains
        }
    )
})




//Controller to getFare of each type of vehicle
export const getFare=asyncHandler(async (req,res) => {
    const {pickup,drop}= req.body
    if(!pickup || !drop){
        return res.status(400)
        .json({
            "message":"Missing pickup or drop"
        })
    }

    const validationErr=validationResult(req)
    if(!validationErr.isEmpty()){
     return   res.status(400).
        json({
            error:validationErr.array()
        })
    }

    const fareDetails = await calcFare(pickup, drop);
    const { fares } = fareDetails; // destructing the fare
    const {distanceInKm,durationInMins}=fareDetails

    return res.status(200)
    .json({
        fares,
        estimatedTime:durationInMins,
        distance:distanceInKm,

    })
})



export const confirmRide=asyncHandler(async (req,res) => {
    const {rideId}=req.body
    const captain=req.captain
    if(!rideId){
        throw new Error('Ride id not found')
    }


    await RideModel.findOneAndUpdate(
        { _id: rideId }, // Filter
        { 
          status: 'accepted', 
          Captain: captain._id 
        }, // Update
        { new: true } // Options
      );

    const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')

      sendMessage(ride.User.socketId,{
        event:"accept-ride",
        data:ride,

      })


      return res.status(200)
      .json({
        ride    
      })
})


//THis controller will start the ride for the captain and fire the socket for user
export const startRide=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
        res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {rideId,otp}=req.body

    if(!rideId || !otp){
        res.status(404).
        json({
            message:'Body Data missing'
        })
    }

    const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')

    if(!ride){
        throw new Error("Ride not found")
    }
    if(!ride.otp===otp){
        throw new Error("Error Otp invalid")
    }

    await RideModel.findByIdAndUpdate({_id:rideId},{
        status:'ongoing'
    })

      const user=ride.User
      sendMessage(user.socketId,{
        event:'start-ride',
        data:ride
      })

      return res.status(200)
      .json({
        message:"Ride Accepted and started",
        ride
      })


})


export const endRide=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
        res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {rideId}=req.body

    if(!rideId){
        res.status(404).
        json({
            message:'Ride id missing'
        })
    }
    const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')
    if(!ride){
        res.status(400)
        .json({
            message:"Ride Id not found"
        })
    }

    if(ride.status!=='ongoing'){
    throw new Error('Ride not ongoing')
    }

    await RideModel.findByIdAndUpdate({_id:rideId},{
        status:'completed'
    })

    const user=ride.User
    sendMessage(ride.User.socketId,{
        event:'payment',
        data:ride
    })   

    return res.status(200).json({
        ride,
        message:"Ride Completed"
    })

})
export const makePayment=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
    return res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {rideId,fare,paymentType,rating}=req.body

    if(!rideId || !fare || !paymentType || !rating){
    return res.status(404).
        json({
            message:'Ride id missing or fare missing'
        })
    }
    const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')
    if(!ride){
    return    res.status(400)
        .json({
            message:"Ride Id not found"
        })
    }
    const captain=ride.Captain
    await CaptainModel.findByIdAndUpdate({
        _id:captain._id
    },
    {rating:rating}
    )
    if(ride.status!=='completed'){
    throw new Error('Ride not completed')
    }

    if(ride.fare===fare)
    await RideModel.findByIdAndUpdate({_id:rideId},{
        status:'completed',
        paymentType:paymentType
    })

    return res.status(200).json({
        ride,
        message:"Ride Completed and payment done"
    })

})

export const seeRides=asyncHandler(async (req,res) => {
        const validationErr=validationResult(req)
    if(!validationErr.isEmpty()){
     return   res.status(400).
        json({
            error:error.array()
        })
    }
    const {requirement}=req.query
    const user=req.user
    const rides = await RideModel.find({
        status: requirement, // Filter by status
        User: user._id,      // Filter by userId
      }).sort({ createdAt: -1 }).limit(5); // Sort by recent and limit results


    if(!rides){
       return res.status(400).
        json({
            message:"Rides not found incorrect requiement"
        })
    }
    return res.status(200)
    .json({
        message:"Rides found Successfully",
        rides
    })
    

})
// Rides can be fetched like cancelled rides completed rides

export const cancelRide = asyncHandler(async (req, res) => {
    const validationErr = validationResult(req);
    if (!validationErr.isEmpty()) {
        return res.status(400).json({ error: validationErr.array() });
    }

    const { rideId } = req.body;
    if (!rideId) {
        throw new Error("Ride ID is required");
    }

    const ride = await RideModel.findById(rideId).populate('Captain');
    if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
    }
    const {pickup}=ride

    const getPickup=await getLatLng(pickup)

    const nearbyCaptains=await getNearbyCaptains(getPickup.latitude,getPickup.longitude,2)
    // console.log(nearbyCaptains)
    
    const { status } = ride;
    if (status === 'pending') {
        await RideModel.findByIdAndUpdate({_id:rideId},{
            status:"cancelled"
          });
         nearbyCaptains.forEach(captain => {
            sendMessage(captain.socketId, {
                event: "ride-cancel-nearby",
                data: ride,
            });
        });
          return res.status(200).
          json({ message: "Pending ride cancelled successfully" });
    }

    if (status === 'accepted') {
        const {fare}=ride
        const fineAmount=calcFine(fare)
        sendMessage(ride.Captain.socketId, {
            event: "accept-ride-cancel",
            data: ride,
          });    
          return res.status(200).json({
            message: "Accepted ride cancelled with a fine",
            fine: fineAmount,
        });    
    }

    return res.status(400).
    json({ message: "Ride cannot be cancelled at this stage" });
});


export const createDelivery=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)
    if(!validationErr.isEmpty()){
        return res.status(400).json({
            error:validationErr.array()
        })
    }
    const {
        pickUp,
        drop,
        vehicleType
    }=req.body
    const user=req.user
    if(!pickUp || !drop || !vehicleType){
        throw new Error('Provide all information')
    }
  
    const fareDetails = await DeliveryModel(pickUp, drop);
    const { fares } = fareDetails; // Ensure fares is used (not fare directly)
    const{ distanceInKm}=fareDetails 
    const {durationInMins}=fareDetails
    const otp=generateOtp(6)
  
  
  
    //FIrst getting the latitudes and longitudes from pickup 
    const getPickup=await getLatLng(pickUp)
   
    const nearbyCaptains=await getNearbyCaptains(getPickup.latitude,getPickup.longitude,2)

    const newRide = await DeliveryModel.create({
        User: req.user._id,
        pickup: pickUp,
        destination: drop,
        vehicleType,
        duration:durationInMins,
        distance:distanceInKm,
        otp:otp,
        fees: fares[vehicleType], // Note: Use `fares` instead of `fare` here
    });
    const newRidewithUser=await RideModel.findOne({_id:newRide._id}).populate('User')
    newRide.otp=""
    nearbyCaptains.map(captain=>
        sendMessage(captain.socketId,{
            event:'new-delivery',
            data:newRidewithUser
        })   
    )
    return res.status(200).json(
        {
            message:"Delivery Created",
            newRidewithUser,
            nearbyCaptains
        }
    )


})


export const startDelivery=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)
    if(!validationErr.isEmpty()){
        return res.status(400)
        .json({
            error:validationErr.array()
        })
    }
    const {deliveryId,otp}=req.body


    if(!deliveryId || !otp){
        res.status(404).
        json({
            message:'Body Data missing'
        })
    }

    const delivery=await DeliveryModel.findOne({_id:rideId}).populate('User').populate('Captain')

    if(!delivery){
        throw new Error("Ride not found")
    }
    if(!delivery.otp===otp){
        throw new Error("Error Otp invalid")
    }

    await DeliveryModel.findByIdAndUpdate({_id:rideId},{
        status:'ongoing'
    })

      const user=delivery.User
      sendMessage(user.socketId,{
        event:'start-delivery',
        data:ride
      })

      return res.status(200)
      .json({
        message:"Delivery Accepted and started",
        delivery
      })
})

export const endDelivery=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
        res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {deliveryId}=req.body

    if(!deliveryId){
        res.status(404).
        json({
            message:'Delivery id missing'
        })
    }
    const delivery=await DeliveryModel.findOne({_id:deliveryId}).populate('User').populate('Captain')
    if(!delivery){
        res.status(400)
        .json({
            message:"Delivery Id not found"
        })
    }

    if(delivery.status!=='ongoing'){
    throw new Error('Ride not ongoing')
    }

    await DeliveryModel.findByIdAndUpdate({_id:rideId},{
        status:'completed'
    })

    const user=delivery.User
    sendMessage(delivey.User.socketId,{
        event:'payment',
        data:ride
    })   

    return res.status(200).json({
        ride,
        message:"Delivery Completed"
    })

})
// export const makeDeliveryPayment=asyncHandler(async (req,res) => {
//     const validationErr=validationResult(req)

//     if(!validationErr.isEmpty()){
//     return res.status(400).
//         json({
//             error:validationErr.array()
//         })
//     }
//     const {rideId,fare,paymentType,rating}=req.body

//     if(!rideId || !fare || !paymentType || !rating){
//     return res.status(404).
//         json({
//             message:'Ride id missing or fare missing'
//         })
//     }
//     const ride=await RideModel.findOne({_id:rideId}).populate('User').populate('Captain')
//     if(!ride){
//     return    res.status(400)
//         .json({
//             message:"Ride Id not found"
//         })
//     }
//     const captain=ride.Captain
//     await CaptainModel.findByIdAndUpdate({
//         _id:captain._id
//     },
//     {rating:rating}
//     )
//     if(ride.status!=='completed'){
//     throw new Error('Ride not completed')
//     }

//     if(ride.fare===fare)
//     await RideModel.findByIdAndUpdate({_id:rideId},{
//         status:'completed',
//         paymentType:paymentType
//     })

//     return res.status(200).json({
//         ride,
//         message:"Delivery Completed and payment done"
//     })

// })


export const getNearbyPolice=asyncHandler(async (req,res) => {
    const validationErr=validationResult(req)

    if(!validationErr.isEmpty()){
    return res.status(400).
        json({
            error:validationErr.array()
        })
    }
    const {rideId,latitude,longitude,reason}=req.body

    if(!rideId  || !longitude || !latitude || !reason){
    return res.status(404).
        json({
            message:'Ride id missing or Location missing missing'
        })
    }
    console.log(rideId,latitude,longitude,reason);
    const ride=await RideModel.findById({_id:rideId})
    if(!ride){
        return res.status(400)
        .json({
            message:"Ride Not Found"
        })
    }
    if(ride.status!=="ongoing"){
        return res.status(400)
        .json({
            message:"Ride Is not started"
        }) 
    }
    await RideModel.findByIdAndUpdate({_id:rideId},{
        policeAlert:{
            reason:reason,
            callMade:true
        }
    })
    const key=process.env.GOMAPS_API_KEY
    const response=await axios.get(`https://maps.gomaps.pro/maps/api/place/nearbysearch/json`,
    {
      params: {
        keyword: "police",
        location: `${latitude},${longitude}`,
        radius: 15, // 1500 meters (Google Maps uses meters, not just '15')
        key: key,
      },
    }
  );        const data=response.data.results
        // console.log(data);
        const nearbyPoliceStation=data[0]
        // console.log(nearbyPoliceStation);
        if(data.length===0){
            return res.status(404).
            json({
                message:"Sorry No nearby Police station"
            })
        }

        sendMessage(ride.Captain.socketId,{
            event:"police-alert",
            data:nearbyPoliceStation
        })
        return res.status(200)
        .json({
            Reason:`${reason} has been duely noted`,
            Message:`${nearbyPoliceStation.name} Has been notified`
        })


})