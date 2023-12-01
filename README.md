# NestJS User Management

This is a backend project for managing user authentication and profile management using NestJS.

## Features

- User Sign-up & Login
- JWT Authentication
- User Profile Management (CRUD operations)
- Password encryption

## Installation

Clone the repository and install dependencies.

```bash
git clone https://github.com/yourusername/nestjs-user-management.git
cd nestjs-user-management
npm install
```

## Configuration

Create a .env file in the root directory and add the following:

```bash
SECRET_KEY=your_jwt_secret
DATABASE_URL=your_database_connection_string
```

## Running the Application

To start the server, run the following command:

```bash
npm run start
```

## Endpoints

The API provides the following endpoints:

- POST /user/login - for user login
- POST /user/token - for refreshing JWT token
- GET /user - for retrieving user profiles
- POST /user - for creating a new user
- GET /user/:id - for retrieving a single user profile
- PATCH /user/:id - for updating user profile
- DELETE /user/:id - for deleting a user profile
- POST /user/logout - for user logout

## Seeding the Database

To seed the database with initial data, run the following command:

```bash
npm run seed
```

## Technologies

- NestJS
- TypeORM
- PostgreSQL
- JWT for authentication
- bcrypt for password hashing
