# CollageAppointmentSystem
Interview Assignment for UnQue Cloudbook

Assignment: Develop backend APIs with one automated test case for a college appointment system that allows students to book appointments with professors. 

## Tech Stack

### Backend

- Language: Node.js, Express.js, TypeScript
- Database: PostgreSQL
- Auth: JWT
- Containerization: Docker

## API Endpoints

- signin & signup
    - `/student` 
        - GET `/` - Get all students
        - POST `/signup` - Register new student. 
        - POST `/signin` - Student login.
    - `/professor` 
        - GET `/` - Get all professors
        - POST `/signup` - Register professor.
        - POST `/signin` - Professor login.
    ```json
    // signup json body
    {
        "email": "user@example.com",
        "user": "user",
        "password": "password"
    }

    // signin json body
    {
        "email": "user@example.com",
        "password": "password"
    }

    // returns 
    {
        "token": "JWT_TOKEN"
    }
    ```

- protected-routes 
    (JWT in autherization header `Bearer --token--`)
    - POST `/timeslots` - Only professor can create timeslots
        ```json
        // create timeslot body 
        {
            "startTime": "2025-01-25T11:10:00Z",
            "endTime": "2025-01-25T11:30:00Z"
        }

        // returns 
        {
            "timeslotId": "timeslot-id" 
        }
        ```

    - GET `/timeslots/:professorId` - Returns all timeslots for given professorId 
    
    - POST `/appointment` - Students can book their timeslot/appointment
        ```json
        // create appointment body
        {
            "timeslotId": "1"
        }

        // returns
        {
            "appointmentId": "appointment-id",
            "startTime": "2025-01-25T11:10:00Z",
            "endTime": "2025-01-25T11:30:00Z"
        }
        ```
    
    - GET `/appointments` - Returns all appointments for user

    - DELETE `/appointment/:appointmentId` - Cancel appointment for given 'appointmentId' (only professor)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/JaskiratAnand/appointment-sys.git
    cd appointment-sys
    ```

2. Set up environment variables: Rename .env.example to .env:
    ```bash
    DATABASE_URL="postgres://root:rootpassword@localhost:5432/clg-appointment?sslmode=disable"
    JWT_SECRET="secret"
    ```

3. Install dependencies:
    ```bash
    pnpm install
    ```

4. Create a db container in docker
    ```bash
    docker compose up
    ```

5. Run database migrations & generate types
    ```bash
    pnpm db:migrate
    pnpm db:generate
    ```

6. Run server
    ```bash
    // dev
    pnpm dev

    // production
    pnpm build
    pnpm start
    ```

Access the application:
The server will run at `http://localhost:3000` by default.
