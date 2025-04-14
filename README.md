# Lynk
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

Lynk is a chat application built with a full-stack JavaScript approach, offering real-time messaging, group chats, and some features for communication.
# Features

- **User Authentication** – Secure signup/login with email verification  
- **Real-Time Messaging** – Instant private messaging between users  
- **Group Chats** – Create and manage group conversations  
- **Friend Management** – Send friend requests, accept/reject, and manage contacts  
- **Media Sharing** – Send images and other files in conversations  
- **User Blocking** – Control who can contact you  
- **Appearance Customization** – Personalize your chat experience  
- **Internationalization** – Available in English and Italian  


# Tech Stack

- **Frontend**: React.js with Vite, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Real-Time Communication**: Socket.io
- **Authentication**: JWT (JSON Web Tokens)
- **Containerization**: Docker & Docker Compose


# Setup with Docker

Clone the repository:
```bash
git clone https://github.com/bughii/lynk.git
cd lynk
```

Start the application with Docker Compose:
```bash
docker-compose up -d
```
Make sure the port 80 is free on your computer or just change the docker-compose.yaml file.

You can access the application at http://localhost:80
