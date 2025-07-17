# מדריך פשוט להעלאת האפליקציה לענן (Google Cloud Run)

מדריך זה מיועד למי שאין לו רקע טכני, וידריך אותך שלב אחר שלב בתהליך העלאת האפליקציה לאינטרנט.

---

### חלק 1: התקנת הכלים הנדרשים

כדי שנוכל "לדבר" עם שרתי הענן של גוגל, אנחנו צריכים להתקין שתי תוכנות על המחשב שלנו.

**1. התקנת Docker Desktop**

*   **מה זה?** תוכנה שעוזרת לנו לארוז את האפליקציה בקופסאות וירטואליות (שנקראות "קונטיינרים").
*   **איך מתקינים?**
    *   **למשתמשי Windows:** לחצו כאן להורדה: [https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe)
    *   **למשתמשי Mac (עם שבב של אפל):** לחצו כאן להורדה: [https://desktop.docker.com/mac/main/arm64/Docker.dmg](https://desktop.docker.com/mac/main/arm64/Docker.dmg)
    *   **למשתמשי Mac (עם שבב של אינטל):** לחצו כאן להורדה: [https://desktop.docker.com/mac/main/amd64/Docker.dmg](https://desktop.docker.com/mac/main/amd64/Docker.dmg)
*   **לאחר ההורדה:** פתחו את הקובץ ועקבו אחר הוראות ההתקנה. בסיום, הפעילו את התוכנה Docker Desktop. חשוב שהיא תישאר פתוחה ברקע.

**2. התקנת Google Cloud SDK**

*   **מה זה?** סט של כלים שמאפשר לנו לתת פקודות לגוגל קלאוד מהמחשב שלנו.
*   **איך מתקינים?**
    *   גשו לאתר הבא: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
    *   בחרו את מערכת ההפעלה שלכם (Windows, macOS, Linux) ועקבו אחר ההוראות המפורטות שם. ההתקנה כוללת הורדת קובץ והרצת מספר פקודות פשוטות בטרמינל.
*   **לאחר ההתקנה:** פתחו טרמינל חדש (או PowerShell/CMD ב-Windows) והריצו את הפקודה `gcloud init`. עקבו אחר ההוראות כדי להתחבר לחשבון הגוגל שלכם.

---

### חלק 2: הגדרת פרויקט ב-Google Cloud

כעת ניצור "מקום" בענן של גוגל שיכיל את האפליקציה שלנו.

1.  **יצירת פרויקט חדש:**
    *   גשו לכתובת: [https://console.cloud.google.com/projectcreate](https://console.cloud.google.com/projectcreate)
    *   תנו שם לפרויקט (למשל, `interrogation-simulator-app`) ולחצו על `Create`.
    *   **חשוב:** העתיקו את ה-**Project ID** שנוצר. תצטרכו אותו בהמשך. הוא נראה בדרך כלל כמו שם הפרויקט עם מספרים בסוף (למשל, `interrogation-simulator-app-123456`).

2.  **הפעלת שירותים נדרשים (APIs):**
    *   אנחנו צריכים להפעיל שני שירותים כדי שהכל יעבוד. לחצו על הקישורים הבאים וודאו שאתם נמצאים בפרויקט הנכון (תוכלו לראות את שם הפרויקט בראש הדף). בכל קישור, לחצו על כפתור ה-`Enable`.
    *   **הפעלת Artifact Registry:** [https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com)
    *   **הפעלת Cloud Run:** [https://console.cloud.google.com/apis/library/run.googleapis.com](https://console.cloud.google.com/apis/library/run.googleapis.com)

3.  **יצירת מאגר לקונטיינרים (Artifact Registry):**
    *   פתחו את הטרמינל (או PowerShell/CMD) והעתיקו את הפקודה הבאה. **החליפו את `your-project-id` ב-Project ID שהעתקתם קודם.**
        ```bash
        gcloud artifacts repositories create your-repo-name --repository-format=docker --location=us-central1 --project=your-project-id
        ```
    *   **הסבר:** פקודה זו יוצרת "מחסן" וירטואלי בשם `your-repo-name` שבו נשמור את האפליקציה הארוזה שלנו. בחרתי במיקום `us-central1` כי הוא נפוץ וזול, אבל כל מיקום אחר יעבוד גם כן.

---

### חלק 3: הגדרת מפתחות API

האפליקציה צריכה "מפתחות" כדי לגשת לשירותים של גוגל (ליכולות ה-AI) ושל ElevenLabs (לקול של ה-AI).

1.  **יצירת קובץ `.env`:**
    *   בתיקייה הראשית של הפרויקט, צרו קובץ חדש בשם `.env`.
    *   פתחו את הקובץ בעורך טקסט.

2.  **מפתח API של Google (Gemini):**
    *   גשו לכתובת: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
    *   לחצו על `Create API key in new project`.
    *   העתיקו את המפתח שנוצר.
    *   בקובץ ה-`.env` שיצרתם, הדביקו את השורה הבאה והחליפו את `your_google_api_key_here` במפתח שהעתקתם:
        ```
        GOOGLE_API_KEY=your_google_api_key_here
        ```

3.  **מפתח API של ElevenLabs:**
    *   גשו לאתר [https://elevenlabs.io/](https://elevenlabs.io/) וצרו חשבון (יש תוכנית חינמית נדיבה).
    *   לאחר ההתחברות, לחצו על אייקון הפרופיל שלכם בפינה הימנית העליונה ובחרו `Profile`.
    *   שם תראו את ה-`API Key` שלכם. העתיקו אותו.
    *   בקובץ ה-`.env`, הוסיפו את השורה הבאה מתחת לשורה הקודמת, והחליפו את `your_elevenlabs_api_key_here` במפתח שהעתקתם:
        ```
        ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
        ```
    *   **חשוב:** בקובץ ה-`.env` לא אמורים להיות רווחים לפני או אחרי סימן השווה `=`.

4.  **הגדרת משתנים נוספים:**
    *   הוסיפו את שתי השורות הבאות לקובץ ה-`.env` שלכם. אין צורך לשנות אותן.
        ```
        MONGODB_URI=mongodb://mongodb:27017/interrogation-simulator
        JWT_SECRET=a_very_secret_and_long_string_for_jwt_that_should_be_changed
        ```

בסיום, קובץ ה-`.env` שלכם אמור להיראות כך (עם המפתחות שלכם):

```
GOOGLE_API_KEY=AIzaSy...
ELEVENLABS_API_KEY=1234abcd...
MONGODB_URI=mongodb://mongodb:27017/interrogation-simulator
JWT_SECRET=a_very_secret_and_long_string_for_jwt_that_should_be_changed
```

---

### חלק 4: העלאת האפליקציה לענן (העתק-הדבק)

זהו השלב האחרון! פשוט העתיקו והדביקו את הפקודות הבאות לטרמינל שלכם, אחת אחרי השנייה.

1.  **התחברות לגוגל קלאוד (אם עוד לא התחברתם):**
    ```bash
    gcloud auth login
    ```

2.  **הגדרת ה-Project ID שלכם (החליפו את `your-project-id` ב-ID שלכם):**
    ```bash
    gcloud config set project your-project-id
    ```

3.  **מתן הרשאות לדוקר:**
    ```bash
    gcloud auth configure-docker
    ```

4.  **בניית והרצת האפליקציה באופן מקומי (לוודא שהכל עובד):**
    *   הריצו את הפקודה הבאה. זה ייקח כמה דקות, כי הוא בונה את כל האפליקציה.
        ```bash
        docker compose build
        ```
    *   עכשיו, הריצו את הפקודה הבאה כדי להפעיל הכל:
        ```bash
        docker compose up -d
        ```
    *   פתחו את הדפדפן בכתובת `http://localhost:8080`. אתם אמורים לראות את האפליקציה.
    *   בסיום הבדיקה, עצרו את האפליקציה עם הפקודה:
        ```bash
        docker compose down
        ```

5.  **העלאת האפליקציה לענן (Cloud Run):**
    *   **הגדירו משתנים (העתיקו את כל הבלוק והדביקו בטרמינל):**
        ```bash
        export PROJECT_ID=$(gcloud config get-value project)
        export REGION=us-central1
        export REPO_NAME=your-repo-name # השם שבחרתם בחלק 2
        export FRONTEND_IMAGE_NAME=frontend
        export BACKEND_IMAGE_NAME=backend
        ```
    *   **תיוג והעלאת ה-Backend:**
        ```bash
        docker tag server-backend:latest ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${BACKEND_IMAGE_NAME}:latest
        docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${BACKEND_IMAGE_NAME}:latest
        ```
    *   **תיוג והעלאת ה-Frontend:**
        ```bash
        docker tag interrogation-simulator-frontend:latest ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${FRONTEND_IMAGE_NAME}:latest
        docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${FRONTEND_IMAGE_NAME}:latest
        ```
    *   **העלאת ה-Backend ל-Cloud Run:**
        ```bash
        gcloud run deploy interrogation-backend --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${BACKEND_IMAGE_NAME}:latest --platform=managed --region=${REGION} --allow-unauthenticated --set-env-vars-from-file=.env
        ```
    *   **העלאת ה-Frontend ל-Cloud Run:**
        *   לאחר שהפקודה הקודמת הסתיימה, היא תדפיס לכם את הכתובת של ה-backend. העתיקו אותה.
        *   הריצו את הפקודה הבאה, **והחליפו את `your_backend_url_here` בכתובת שהעתקתם:**
            ```bash
            gcloud run deploy interrogation-frontend --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${FRONTEND_IMAGE_NAME}:latest --platform=managed --region=${REGION} --allow-unauthenticated --set-env-vars=VITE_API_BASE_URL=your_backend_url_here
            ```

6.  **סיימתם!**
    *   הפקודה האחרונה תדפיס לכם את הכתובת של ה-frontend. גשו אליה בדפדפן, והאפליקציה שלכם באוויר!
