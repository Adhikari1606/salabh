import React,{useEffect, useState} from 'react'
import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, User, CheckCircle } from 'lucide-react';
import { DriverAcceptRide, Header } from '../Components';
import { useContext } from 'react';
import { CaptainContext, CaptainDataContext } from '../Context/CaptainContext';
import { SocketContext } from '../Context/SocketContext';
function CaptainHome() {
   
    const [rides, setRides] = useState({});
    const [acceptedRides,setAcceptedRides]=useState([])
    const [location,setLocation]=useState()
    const {captain}=useContext(CaptainDataContext)
    const {socket}=useContext(SocketContext)

useEffect(()=>{
  // console.log('sending captian',`${captain}`)
socket.emit('join',{userId:captain._id,role:"captain"})

const sendLocation=function()
{
  // console.log('location gets called');
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(location=>
     {
      socket.emit('update-location',{
        id:captain._id,
        location:{
          lat:location.coords.latitude,
          lng:location.coords.longitude
        }
      })
     }
    )
  }
}



const locationDelay=setInterval(sendLocation,1000)//storing the delay in an variable so that unmounting can be easy
return()=>clearInterval(locationDelay)

},[captain])


socket.on('new-ride',(data)=>{
  console.log(data);
  setRides(data)
})

const handleLogout = () => {
  // Implement logout logic here
  console.log("Logging out...")
  // After logout, redirect to login page
  router.push("/login")
}

    return (
        <>
       <Header />
       <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
      >
        Logout
      </button>

      {rides && <DriverAcceptRide rideData={rides} />}
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Available Ride Requests</h1>
      </div>
      </>
    )
}

export default CaptainHome
