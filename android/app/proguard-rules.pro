# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve line numbers & annotations for Play Console crash deobfuscation and Capacitor reflection
-keepattributes SourceFile,LineNumberTable,*Annotation*,Signature,InnerClasses,EnclosingMethod
-renamesourcefileattribute SourceFile

# Keep Capacitor Bridge, Custom Plugins, and Reflective Callbacks
-keep class com.getcapacitor.** { *; }
-keep class com.petbhai.app.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
    @com.getcapacitor.PluginMethod <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.PermissionCallback <methods>;
}

# Keep Google Play Services Auth classes for NativeGoogleAuthPlugin
-keep class com.google.android.gms.auth.** { *; }
-keep class com.google.android.gms.common.** { *; }
-dontwarn com.google.android.gms.**
