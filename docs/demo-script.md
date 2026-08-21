# 🎬 CareerLens — 2-3 Minute Video Demo Walkthrough Script

Use this structured script when recording a video walkthrough or presenting a live portfolio demonstration of **CareerLens**.

---

## ⏱️ Timeline Breakdown

| Time | Segment | Focus / Action |
|---|---|---|
| **0:00 – 0:25** | **Intro & Authentication** | Pitch the problem students face + sign in with LinkedIn UI |
| **0:25 – 0:50** | **Resume Upload & AI Parsing** | Upload PDF resume -> Anthropic Claude extracts verified skills |
| **0:50 – 1:25** | **Job Matching & Explanations** | 5-factor matching algorithm + AI "Why this match?" breakdown |
| **1:25 – 1:55** | **AI Learning Roadmap** | Interactive week-by-week skill bridging checklist |
| **1:55 – 2:25** | **Saved Jobs, Apply & Tracker** | Save bookmark -> Apply with tracker -> Live status stepper |
| **2:25 – 2:50** | **Real-Time Notifications & Arch** | Socket.IO live alerts -> Redis cache -> Production tech stack |

---

## 🎙️ Step-by-Step Script & Actions

### 1. Introduction & Authentication (0:00 - 0:25)
* **Screen:** Open `http://localhost:5173/login`
* **Voiceover:**
  > *"Hi! This is **CareerLens**, an AI-powered job and internship intelligence platform built specifically for students and early-career software engineers. Applying to jobs is overwhelming when you don't know why a company rejected you or what skills you're missing. CareerLens fixes this by extracting your candidate profile from your PDF resume, ranking live tech jobs with a 5-factor weighted algorithm, and generating personalized learning roadmaps with Claude AI."*
* **Action:** Log in with a student account (or click register to demonstrate clean validation).

---

### 2. Resume Upload & AI Profile Extraction (0:25 - 0:50)
* **Screen:** Navigate to `/upload` and drop a PDF resume (or click **Quick-Load Sample Profile**)
* **Voiceover:**
  > *"When a student uploads their resume, our backend extracts the text, validates PDF magic bytes for security, and sends it through Claude AI to extract verified technical skills, university education, projects, and work experience into a structured candidate profile."*
* **Action:** Land on `/profile` showcasing categorized skill badges, projects, education, and preferred roles.

---

### 3. Smart Matching Engine & AI Explanations (0:50 - 1:25)
* **Screen:** Click **Jobs** in the navbar to open `/jobs`
* **Voiceover:**
  > *"CareerLens doesn't just give you a raw match score — it gives you transparent career mentorship. When I click on this software engineer listing, the platform breaks down why I matched, highlighting projects from my resume that prove my skills, alongside the exact requirements I'm missing."*
* **Action:** Click into the job card to open `/jobs/:id`
* **Voiceover:**
  > *"Instead of just showing a raw score, our AI Match Explainer generates a candidate verdict badge, key technical strengths referencing our actual portfolio projects, and specific growth areas."*

---

### 4. Personalized AI Learning Roadmap (1:25 - 1:55)
* **Screen:** Click **"Improve My Match (AI Roadmap)"** to open `/jobs/:id/roadmap`
* **Voiceover:**
  > *"If a student is missing skills like Docker or AWS, they don't have to guess how to prepare. CareerLens generates a structured 3 to 6-week action plan with week-by-week focus topics, documentation links, and practical mini-projects. As the student finishes tasks, the interactive checklist updates progress dynamically."*
* **Action:** Click 2-3 checklist task checkboxes and watch the completion progress bar animate!

---

### 5. Saved Jobs, Application Tracking & Stepper (1:55 - 2:25)
* **Screen:** Click back to the job, click **Save Job**, then click **Apply Now**
* **Voiceover:**
  > *"Students can save roles with instant optimistic bookmarking and apply directly. Clicking 'Apply Now' launches the company portal while simultaneously logging the application into the student's personal tracker."*
* **Action:** Navigate to `/applications`
* **Voiceover:**
  > *"The My Applications dashboard provides a visual horizontal stepper: Applied, Shortlisted, Interview, and Offer. Students can self-report their progress with one click."*
* **Action:** Change status to **Interview**.

---

### 6. Real-Time Notifications & Architecture Wrap-Up (2:25 - 2:50)
* **Screen:** Point to the **Alerts Bell** icon in the navbar
* **Voiceover:**
  > *"Notice the notification bell immediately updated with a red badge in real-time without refreshing the page! Powered by Socket.IO, students receive live alerts when application statuses change or new 85%+ matching jobs are posted."*
* **Action:** Open the notification dropdown panel to show the live alert.
* **Voiceover:**
  > *"Behind the scenes, CareerLens is built on a high-performance production stack: React 18 and Tailwind on Vite, an Express REST API with MongoDB and Redis caching, Socket.IO for real-time application updates, and Anthropic Claude for AI reasoning. Thank you for watching!"*

---

## 💡 Presenter Tips
- Keep your browser window at 1920x1080 or standard 16:9 for clean video presentation.
- Use a high-contrast cursor if your screen recording software supports it.
- Practice clicking the status change on `/applications` while watching the bell icon in the navbar to emphasize the zero-refresh Socket.IO delivery!
