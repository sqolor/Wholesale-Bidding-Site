console.log("Service Worker Loaded...");

self.addEventListener("push", e => {
  const data = e.data.json();
  console.log("Push Recieved...");
  self.registration.showNotification(data.title, {
    body: "Test Push",
    icon: "https://www.iconspng.com/images/pepe/pepe.jpg"
  });
});
