package com.petbhai.app;

import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {

    private GoogleSignInClient googleSignInClient;

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            int clientIdResId = getContext().getResources().getIdentifier("default_web_client_id", "string", getContext().getPackageName());
            String serverClientId = "";
            if (clientIdResId != 0) {
                serverClientId = getContext().getString(clientIdResId);
            }
            if (serverClientId == null || serverClientId.isEmpty()) {
                serverClientId = "249260469484-598c9i6jkojguqaa90omakv5ul2du1p0.apps.googleusercontent.com";
            }

            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(serverClientId)
                .requestEmail()
                .requestProfile()
                .build();

            googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);

            // Sign out first to ensure account picker dialog always appears
            googleSignInClient.signOut().addOnCompleteListener(task -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(call, signInIntent, "handleSignInResult");
            });
        } catch (Exception e) {
            call.reject("Failed to initialize Google Sign-In: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        Intent data = result.getData();
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            if (account != null) {
                JSObject ret = new JSObject();
                ret.put("idToken", account.getIdToken());
                ret.put("email", account.getEmail() != null ? account.getEmail() : "");
                ret.put("displayName", account.getDisplayName() != null ? account.getDisplayName() : "");
                ret.put("givenName", account.getGivenName() != null ? account.getGivenName() : "");
                ret.put("familyName", account.getFamilyName() != null ? account.getFamilyName() : "");
                ret.put("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : "");
                ret.put("userId", account.getId() != null ? account.getId() : "");
                call.resolve(ret);
            } else {
                call.reject("Google Sign-In returned null account.");
            }
        } catch (ApiException e) {
            String errorMsg = "Google Sign-In failed (" + e.getStatusCode() + "): " + e.getMessage();
            if (e.getStatusCode() == 12501) {
                errorMsg = "Sign-in was cancelled.";
            } else if (e.getStatusCode() == 10) {
                errorMsg = "Configuration error (code 10). Please verify SHA-1 in Firebase Console.";
            }
            call.reject(errorMsg, String.valueOf(e.getStatusCode()), e);
        } catch (Exception e) {
            call.reject("Unexpected error during Google Sign-In: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        if (googleSignInClient != null) {
            googleSignInClient.signOut().addOnCompleteListener(task -> {
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            });
        } else {
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        }
    }
}
