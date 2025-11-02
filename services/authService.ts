// services/authService.ts

// This is a mock service to simulate authentication.
// In a real application, you would use a library like Firebase Auth,
// NextAuth, or your own backend to handle this.

interface MockUser {
    firstName: string;
    lastName: string;
    email: string;
}

const simulateApiCall = <T>(data: T, delay = 1500): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
}

export const signInWithGoogle = (): Promise<MockUser> => {
    console.log("Simulating Google Sign-In...");
    return simulateApiCall({
        firstName: 'Israt',
        lastName: 'Jahan',
        email: 'israt.google@example.com'
    });
};