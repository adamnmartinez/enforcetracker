//import express, { Router } from 'express';
//import { pool } from './test.js'
//const HOST = ""

const addEntryValidity = (user: string) =>{
  try{
    fetch(HOST + "/tasks/addUser", {
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

const endorsePin = (user: string, pid: string) =>{
  try{
    fetch(HOST + "/tasks/add", {
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
    console.log("Error")
    console.log(e)
  }
}

const unendorsePin = (user: string, pid: string) =>{

  try{

    fetch(HOST + "/tasks/delete", {
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
    console.log("Error")
    console.log(e)
  }
}

const allValidates = (pid: string)=>{
  try{
    fetch(HOST + "/tasks/validates/" + pid, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "pid": pid,
      },
    }
  ).then((response)=>{
      response.json().then((data)=>{
        if(response.status == 200){
          console.log(data)
          return data
          console.log("Success")
          //console.log(response)
        }else{
          console.log("Error")
        }
      })
    })
  } catch (e){
    console.log("Error")
    console.log(e)
  }
}
