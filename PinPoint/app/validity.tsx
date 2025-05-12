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

const unendorsePin = (user: number, pid: number) =>{
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
