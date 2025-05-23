import { useRouter } from "expo-router";
import { HOST } from "./server";

export function addEntryValidity(user: string){
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

export function endorsePin(user: string, pid: string){
   try{
    fetch(HOST + "/api/validates/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: user,
        pin:  pid,
      })
    }).then((response) => {
      response.json().then((data) => {
        if (response.status == 201) {
          console.log("Success")
        }else{
          console.log("Internal Error")
        }
      })
    })
  }catch (e){
    console.log("Unable to connect")
    console.log(e)
  }
}

export function unendorsePin(user: string, pid: string){
  try{
    fetch(HOST + "/api/validates/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: user,
        pin:  pid,
      })
    }).then((response) => {
      response.json().then((data) => {
        if (response.status == 201) {
          console.log("Success")
        }else{
          console.log("Internal Error")
        }
      })
    })
  }catch (e){
    console.log("Unable to connect")
    console.log(e)
  }
}

export function userEndorsed(pid: string){
  try{
    fetch(HOST + "/api/validates/" + pid, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    }).then((response) => {
      response.json().then((data) => {
        if (response.status == 200) {
          console.log("Success")
        }else{
          console.log("Internal Error")
        }
      })
    })
  }catch (e){
    console.log("Unable to connect")
    console.log(e)
  }
}

export {addEntryValidity, userEndorsed, unendorsePin, endorsePin}
