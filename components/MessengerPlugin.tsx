import React, { useEffect } from 'react';

// FIX: Add global type declarations for Facebook SDK properties and custom attributes.
// This informs TypeScript about properties on the `window` object and custom HTML attributes
// that are dynamically added by the Facebook SDK, resolving compile-time errors.
declare global {
  // Extend the Window interface to include properties added by the Facebook SDK.
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: { xfbml: boolean; version: string }) => void;
    };
  }

  // Extend React's HTMLAttributes to allow for Facebook's custom chat plugin attributes.
  namespace React {
    interface HTMLAttributes<T> {
      page_id?: string;
      attribution?: string;
      logged_in_greeting?: string;
      logged_out_greeting?: string;
    }
  }
}

const MessengerPlugin: React.FC = () => {
  useEffect(() => {
    // This effect hook will run once when the component mounts.
    // It's responsible for loading and initializing the Facebook SDK.

    // Define the global fbAsyncInit function. The SDK calls this once it's loaded.
    window.fbAsyncInit = function() {
      // Initialize the SDK
      if (window.FB) {
          window.FB.init({
            xfbml      : true,  // This tells the SDK to parse social plugins on the page.
            version    : 'v19.0' // Use a specific, recent API version.
          });
      }
    };

    // This is a standard IIFE (Immediately Invoked Function Expression) to load an external script.
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      // If the script tag with this ID already exists, don't add it again.
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement; js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    }(document, 'script', 'facebook-jssdk'));

  }, []); // The empty dependency array means this effect runs only once.

  return (
    <>
      <div id="fb-root"></div>
      <div 
        className="fb-customerchat"
        // --- IMPORTANT ---
        // You MUST replace '106952955493913' with your actual Facebook Page ID.
        // You can find your Page ID in the "About" section of your Facebook Page.
        page_id="106952955493913" 
        attribution="biz_inbox"
        logged_in_greeting="Hi! How can we help you with PetBhai today?"
        logged_out_greeting="Hi! How can we help you with PetBhai today?"
      ></div>
    </>
  );
};

export default MessengerPlugin;