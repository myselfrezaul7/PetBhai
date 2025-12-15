import React, { useEffect } from 'react';

// The global type declarations for this component have been moved to `types.ts`
// to ensure they are applied globally across the project. This resolves potential
// TypeScript errors related to the custom HTML attributes used by the Facebook SDK.

const MessengerPlugin: React.FC = () => {
  useEffect(() => {
    // This effect hook will run once when the component mounts.
    // It's responsible for loading and initializing the Facebook SDK.

    // Define the global fbAsyncInit function. The SDK calls this once it's loaded.
    window.fbAsyncInit = function () {
      // Initialize the SDK
      if (window.FB) {
        window.FB.init({
          xfbml: true, // This tells the SDK to parse social plugins on the page.
          version: 'v19.0', // Use a specific, recent API version.
        });
      }
    };

    // This is a standard IIFE (Immediately Invoked Function Expression) to load an external script.
    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      // If the script tag with this ID already exists, don't add it again.
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    })(document, 'script', 'facebook-jssdk');
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
