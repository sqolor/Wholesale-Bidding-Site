console.log("Service Worker Loaded...");

self.addEventListener("push", e => {
  const data = e.data.json();
  console.log("Push Recieved...");
  if(data.title.includes("No")){
    self.registration.showNotification(data.title, {
      body: "No New Auctions",
      icon: "logo.ico"
    });
  }
  else {
    self.registration.showNotification(data.title, {
      body: "New Auctions in Your Subscriptions",
      icon: "logo.ico"
    });
  }
});
