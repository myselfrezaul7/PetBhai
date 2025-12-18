// services/authService.ts

// This service handles third-party authentication.
// To use REAL Google Sign-in:
// 1. Go to Google Cloud Console and create a Web Client ID.
// 2. Add your Client ID to your environment or configuration.

interface MockUser {
    firstName: string;
    lastName: string;
    email: string;
}

const simulateApiCall = <T>(data: T, delay = 1000): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay));
}

export const signInWithGoogle = (): Promise<MockUser> => {
    // FIX: Instead of hardcoded dummy data, we'll prompt the user 
    // for their name to make the demo feel real until the API is configured.
    const fullName = window.prompt("Google Sign-In is in 'Demo Mode'.\n\nPlease enter the name you want to use for PetBhai:", "Pet Lover");
    
    if (!fullName) {
        throw new Error("Login cancelled by user.");
    }

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || 'New';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Member';

    console.log("Simulating Google Sign-In with user details...");
    
    return simulateApiCall({
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}@example.com`
    });
};