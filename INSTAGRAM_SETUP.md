# 📸 Instagram Social2Earn Integration Guide (No Page Required)
# دليل ربط إنستغرام بدون صفحة فيسبوك

## 1️⃣ Step 1: Create Meta App (إنشاء تطبيق ميتا)
We need a "Meta App" to connect your website to Instagram.
خاصنا "تطبيق" فـ Facebook Developers باش نربطو الموقع.

### **Steps / الخطوات:**

1. **Go to / دخل لهاد الرابط:**
   👉 [developers.facebook.com](https://developers.facebook.com)

2. **Log in** with your normal Facebook account.
   سجل الدخول بحساب فيسبوك العادي ديالك.

3. Click **"My Apps"** (top right) -> **"Create App"**.
   ضغط على "My Apps" الفوق -> "Create App".

4. **Select App Type / اختار النوع:**
   *   Choose **"Other"** (أخرى) -> Next.
   *   Select **"Business"** (أعمال) -> Next.

5. **App Details / معلومات التطبيق:**
   *   **App Name:** `AKGS Empire Social` (or any name).
   *   **App Contact Email:** Your email.
   *   **Business Portfolio:** Leave it as "No Business Portfolio" (خليها خاوية).
   *   Click **"Create App"**.

6. **Add Products / إضافة المنتجات:**
   *   Find **"Instagram"** (Not "Instagram Graph API") -> Click **"Set up"**.
   *   *Note: If you don't see "Instagram", look for "Instagram Basic Display".*

---

## 2️⃣ Step 2: Generate Token (استخراج الكود)
This is the most important part. We will use the **Graph API Explorer**.
هادي أهم مرحلة. غادي نستعملو "Graph API Explorer" باش نجبدو الكود.

1. **Go to / سير لهاد الرابط:**
   👉 [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

2. **Settings / الإعدادات (يمين الشاشة):**
   *   **Meta App:** Select your app (`AKGS Empire Social`).
   *   **User or Page:** Select **"User Token"**.

3. **Add Permissions / زيد الصلاحيات:**
   *   Search and add these **EXACT** permissions (كتب هادو بالحرف):
     *   `instagram_business_basic`
     *   `instagram_business_manage_comments`
     *   `instagram_business_content_publish`
     *   `public_profile`

4. **Generate Token / ولد الكود:**
   *   Click **"Generate Access Token"**.
   *   A popup will appear asking you to login with **Instagram**.
   *   **Important:** Login with your **Professional Instagram Account** (AKGS).
   *   **Authorize** the app.

5. **Copy the Token / انسخ الكود:**
   *   Copy the long code that starts with `EAA...`.
   *   Send it to me here! / صيفطو ليا هنا!

---

## 3️⃣ Step 3: Verify (التأكد)
Once you send the token, I will verify it immediately.
غير تصيفط الكود، غادي نتأكد منو دغيا.
