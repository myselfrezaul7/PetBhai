const a=(e,o=1500)=>new Promise(t=>setTimeout(()=>t(e),o)),s=()=>(console.log("Simulating Google Sign-In..."),a({firstName:"Israt",lastName:"Jahan",email:"israt.google@example.com"}));export{s};
