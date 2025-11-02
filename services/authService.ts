// services/authService.ts

// This is a mock service to simulate third-party authentication.
// In a real-world application, this file would contain the logic for
// interacting with an authentication provider like Firebase Authentication,
// Auth0, or a custom OAuth flow. The functions would make actual network
// requests and handle redirects or pop-ups for the sign-in process.
// The `simulateApiCall` helper is used here to mimic the asynchronous
// nature of these operations.

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