import { HOST } from "./server";

const addEntryValidity = (user: string) => {
  try{
    fetch(HOST + "/api/validates/addUser", {
      method: "POST",
      headers:{
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: user,
      })
    }).then((response) =>{
      response.json().then((data)=>{
        if (response.status == 201){
          console.log("Success")
        }else{
          console.log("Error")
        }
      })
    })
  }catch(e){
    console.log(e)
  }
}

const endorsePin = async (user: string, pid: string) => {
   try{
    const response = await fetch(HOST + "/api/validates/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: user,
        pin:  pid,
      })
    })

    if (response.status == 200) {
      console.log("Endorse Success")
    }else{
      console.log("Internal Error")
    }
  } catch (e){
    console.log("Unable to connect")
    console.log(e)
  }
}

const unendorsePin = async (user: string, pid: string) => {
  try{
    const response = await fetch(HOST + "/api/validates/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: user,
        pin:  pid,
      })
    })
    
    if (response.status == 200) {
      console.log("Unendorse Success")
    }else{
      console.log("Internal Error")
    }
  }catch (e){
    console.log("Unable to connect")
    console.log(e)
  }
}

const userEndorsed = (uid: string, pid: string) => {
  try {
    fetch(HOST + "/api/validates/isvalidated", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: uid,
        pin: pid
      })
    }).then((response) => {
      response.json().then((data) => {
        if (response.status == 200) {
          return data.validated
        } else {
          console.log("Internal Error")
        }
      })
    })
  } catch (e){
    console.log("Unable to connect")
    console.log(e)
  }
}

export {addEntryValidity, userEndorsed, unendorsePin, endorsePin}
