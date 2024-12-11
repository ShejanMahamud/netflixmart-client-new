self.addEventListener('push', (event) => {
  const data = event.data.json();
  const { title, body, image } = data.notification;

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isMobile) {
    const options = {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      image: image,
    };
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there is an open app window, focus on it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      return clients.openWindow('/');
    })
  );
});