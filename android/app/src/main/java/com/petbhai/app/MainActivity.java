package com.petbhai.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private String pendingDeepLink = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);

        // Ensure proper system bar & camera cutout insets on Android 15/16 (targetSdk 36)
        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
        }

        // Tune WebView for 120Hz smoothness & consistent layout scaling
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            WebSettings settings = webView.getSettings();
            settings.setTextZoom(100);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            webView.addJavascriptInterface(new DeepLinkBridge(), "PetBhaiNative");
        }

        handleDeepLinkIntent(getIntent(), false);

        // Handle Android hardware back button & predictive back gesture smoothly with React Router
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    moveTaskToBack(true);
                    return;
                }
                WebView webView = getBridge().getWebView();
                webView.evaluateJavascript(
                    "(function(){ try { return typeof window.__petbhaiHandleBack === 'function' ? window.__petbhaiHandleBack() : 'default'; } catch(e) { return 'default'; } })()",
                    result -> {
                        if (result != null && result.contains("handled")) {
                            return;
                        }
                        if (result != null && result.contains("default") && webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            moveTaskToBack(true);
                        }
                    }
                );
            }
        });
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLinkIntent(intent, true);
    }

    private void handleDeepLinkIntent(Intent intent, boolean dispatchImmediately) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) {
            return;
        }
        Uri data = intent.getData();
        if (data == null) {
            return;
        }
        String host = data.getHost();
        if (host == null || (!"www.petbhai.com".equalsIgnoreCase(host) && !"petbhai.com".equalsIgnoreCase(host))) {
            return;
        }

        String path = data.getEncodedPath();
        if (path == null || path.isEmpty()) {
            path = "/";
        }
        String query = data.getEncodedQuery();
        String fragment = data.getEncodedFragment();
        StringBuilder routeBuilder = new StringBuilder(path);
        if (query != null && !query.isEmpty()) {
            routeBuilder.append('?').append(query);
        }
        if (fragment != null && !fragment.isEmpty()) {
            routeBuilder.append('#').append(fragment);
        }
        final String targetRoute = routeBuilder.toString();
        pendingDeepLink = targetRoute;

        if (dispatchImmediately && getBridge() != null && getBridge().getWebView() != null) {
            final WebView webView = getBridge().getWebView();
            final String quotedRoute = JSONObject.quote(targetRoute);
            webView.post(() -> webView.evaluateJavascript(
                "(function(){ var r=" + quotedRoute + "; window.__petbhaiDeepLink=r; if(typeof window.__petbhaiNavigate==='function'){ window.__petbhaiNavigate(r); window.__petbhaiDeepLink=null; } })()",
                null
            ));
            pendingDeepLink = null;
        }
    }

    public class DeepLinkBridge {
        @JavascriptInterface
        public String consumeDeepLink() {
            String link = pendingDeepLink;
            pendingDeepLink = null;
            return link != null ? link : "";
        }
    }
}
