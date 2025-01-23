
export interface User {
    readonly id: string;
    email: string;
    name: string;
    password: string;
}
export type userSignUp = Pick<User, 'email' | 'password' | 'name'>
export type userSignIn = Pick<User, 'email' | 'password'>;
export type getUser = Pick<User, 'id' | 'email' | 'name'>;

export enum Role {
    STUDENT = "student",
    PROFESSOR = "professor"
}

export interface createTimeSlot {
    startTime: Date;
    endTime: Date;
}

