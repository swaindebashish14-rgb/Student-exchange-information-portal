/* ==========================================================================
   data.js  -  Sample data for Passage (Student Exchange Information Portal)

   All universities, programs, dates and rules below are made-up sample data
   for a course project. They do not describe any real exchange agreement.

   Deadlines are written as "days from today" (see addDays below). They are
   worked out ONCE, the first time the site is opened in a browser, and then
   copied into localStorage. After that the dates stay fixed, so programs
   slowly move from open to closed. Use "Reset to sample data" on the Admin
   page (or clear the site data) to get fresh dates and to pick up any
   changes you make to this file.
   ========================================================================== */

// Turns a Date object into the "YYYY-MM-DD" text that <input type="date"> uses.
function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// Returns the date that is n days from today, as "YYYY-MM-DD".
function addDays(n) {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return toInputDate(date);
}

// The fields of study shown in the filters and in the admin form.
const FIELDS = ["Computer Science", "Engineering", "Business", "Science", "Design", "Humanities"];

const DEFAULT_PROGRAMS = [
  {
    id: "p1",
    institution: "Lakeshore University",
    city: "Vancouver",
    country: "Canada",
    code: "YVR",
    title: "Computing Systems Semester",
    field: "Computer Science",
    duration: "1 semester",
    intake: "January 2027",
    seats: 4,
    language: "English, IELTS 6.5 or equivalent",
    fees: "Tuition waived under the exchange agreement. Housing and living costs are paid by the student.",
    minCgpa: 7.5,
    minSemester: 4,
    deadline: addDays(23),
    about: "Spend a semester in Vancouver studying operating systems, networks and software engineering next to local students. Credits transfer back through a pre-approved course list.",
    courses: ["Operating Systems Design", "Computer Networks", "Software Engineering Studio", "Database Internals"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Statement of purpose (500 words)",
      "Faculty recommendation letter",
      "IELTS or TOEFL score report",
      "No-objection certificate from the university",
      "Proof of funds"
    ]
  },
  {
    id: "p2",
    institution: "Nordhaven Institute of Technology",
    city: "Stockholm",
    country: "Sweden",
    code: "ARN",
    title: "Sustainable Engineering Exchange",
    field: "Engineering",
    duration: "1 semester",
    intake: "January 2027",
    seats: 3,
    language: "English, IELTS 6.0 or equivalent",
    fees: "Tuition waived. A small housing grant is available to selected students.",
    minCgpa: 7.0,
    minSemester: 3,
    deadline: addDays(37),
    about: "Project-based courses on energy systems, materials and urban design, taught in English. Students join a team project with Swedish classmates.",
    courses: ["Renewable Energy Systems", "Sustainable Materials", "Urban Infrastructure Studio"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Statement of purpose (400 words)",
      "Faculty recommendation letter",
      "English test score report",
      "No-objection certificate from the university"
    ]
  },
  {
    id: "p3",
    institution: "Pacific Ridge University",
    city: "Melbourne",
    country: "Australia",
    code: "MEL",
    title: "Business Analytics Term",
    field: "Business",
    duration: "1 trimester",
    intake: "March 2027",
    seats: 5,
    language: "English, IELTS 6.5 or equivalent",
    fees: "Tuition waived under the exchange agreement. Student visa and health cover are paid by the student.",
    minCgpa: 7.0,
    minSemester: 4,
    deadline: addDays(73),
    about: "Learn to turn business data into decisions through case studies with Melbourne companies. The term ends with a team consulting project.",
    courses: ["Business Analytics", "Marketing Data Lab", "Operations Strategy", "Consulting Project"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Statement of purpose (500 words)",
      "Faculty recommendation letter",
      "IELTS or TOEFL score report",
      "Proof of funds",
      "Passport-size photographs"
    ]
  },
  {
    id: "p4",
    institution: "Rheinfeld University of Applied Sciences",
    city: "Berlin",
    country: "Germany",
    code: "BER",
    title: "Embedded Systems and Robotics",
    field: "Engineering",
    duration: "1 semester",
    intake: "April 2027",
    seats: 2,
    language: "English, TOEFL 80 or equivalent. German is not required.",
    fees: "No tuition fees. Semester contribution and housing are paid by the student.",
    minCgpa: 7.8,
    minSemester: 5,
    deadline: addDays(95),
    about: "Hands-on laboratory work on microcontrollers, sensors and mobile robots. Students finish with a working prototype demonstrated to industry partners.",
    courses: ["Embedded Programming", "Robot Perception", "Control Systems Lab"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Statement of purpose (500 words)",
      "Two faculty recommendation letters",
      "TOEFL or IELTS score report",
      "No-objection certificate from the university",
      "Proof of funds"
    ]
  },
  {
    id: "p5",
    institution: "Merlion Technical University",
    city: "Singapore",
    country: "Singapore",
    code: "SIN",
    title: "Data Science and AI",
    field: "Computer Science",
    duration: "1 semester",
    intake: "January 2027",
    seats: 3,
    language: "English, no test required for students from English-medium programs",
    fees: "Tuition waived. Housing on campus is available for a fee.",
    minCgpa: 8.0,
    minSemester: 5,
    deadline: addDays(14),
    about: "Advanced courses in machine learning and large-scale data systems, with an optional research placement in a university lab.",
    courses: ["Machine Learning", "Big Data Systems", "Applied Statistics", "Research Placement"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Statement of purpose (500 words)",
      "Faculty recommendation letter",
      "No-objection certificate from the university"
    ]
  },
  {
    id: "p6",
    institution: "Sakuragawa University",
    city: "Tokyo",
    country: "Japan",
    code: "HND",
    title: "Japanese Language and Culture",
    field: "Humanities",
    duration: "2 semesters",
    intake: "April 2027",
    seats: 4,
    language: "English for classes. A beginner Japanese course is part of the program.",
    fees: "Tuition waived. A monthly scholarship may be offered to selected students.",
    minCgpa: 6.5,
    minSemester: 3,
    deadline: addDays(108),
    about: "A full academic year of language classes and cultural studies, with a homestay option in the first month.",
    courses: ["Beginner Japanese", "Modern Japanese Society", "Media and Popular Culture"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Statement of purpose (400 words)",
      "Faculty recommendation letter",
      "No-objection certificate from the university",
      "Passport-size photographs"
    ]
  },
  {
    id: "p7",
    institution: "Hanrim University",
    city: "Seoul",
    country: "South Korea",
    code: "ICN",
    title: "Digital Media and Design Term",
    field: "Design",
    duration: "1 semester",
    intake: "March 2027",
    seats: 2,
    language: "English, IELTS 6.0 or equivalent",
    fees: "Tuition waived. Dormitory places are limited and allotted first come, first served.",
    minCgpa: 7.0,
    minSemester: 3,
    deadline: addDays(-14),
    about: "Studio courses in interaction design, motion graphics and game art, with a final showcase open to the public.",
    courses: ["Interaction Design", "Motion Graphics", "Game Art Studio"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Design portfolio (PDF)",
      "Statement of purpose (400 words)",
      "Faculty recommendation letter"
    ]
  },
  {
    id: "p8",
    institution: "Liffeyside College",
    city: "Dublin",
    country: "Ireland",
    code: "DUB",
    title: "Cyber Security Exchange",
    field: "Computer Science",
    duration: "1 semester",
    intake: "January 2027",
    seats: 3,
    language: "English, IELTS 6.5 or equivalent",
    fees: "Tuition waived under the exchange agreement. Living costs are paid by the student.",
    minCgpa: 7.5,
    minSemester: 5,
    deadline: addDays(32),
    about: "Courses on secure software, network defence and digital forensics, with lab sessions run by Dublin security companies.",
    courses: ["Secure Software Development", "Network Defence", "Digital Forensics"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Statement of purpose (500 words)",
      "Faculty recommendation letter",
      "IELTS or TOEFL score report",
      "No-objection certificate from the university"
    ]
  },
  {
    id: "p9",
    institution: "Canalside University",
    city: "Amsterdam",
    country: "Netherlands",
    code: "AMS",
    title: "Entrepreneurship and Innovation",
    field: "Business",
    duration: "1 semester",
    intake: "February 2027",
    seats: 4,
    language: "English, IELTS 6.5 or equivalent",
    fees: "Tuition waived. Housing is arranged through the host university for a fee.",
    minCgpa: 7.2,
    minSemester: 4,
    deadline: addDays(50),
    about: "Build and pitch a start-up idea with students from across Europe. Mentors from the local start-up community join the final presentations.",
    courses: ["Venture Creation", "Product Strategy", "Innovation Lab"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Statement of purpose (500 words)",
      "Faculty recommendation letter",
      "IELTS or TOEFL score report",
      "Proof of funds"
    ]
  },
  {
    id: "p10",
    institution: "Alpenrand University of Science",
    city: "Zurich",
    country: "Switzerland",
    code: "ZRH",
    title: "Applied Physics and Materials",
    field: "Science",
    duration: "1 semester",
    intake: "February 2027",
    seats: 2,
    language: "English, TOEFL 90 or equivalent",
    fees: "Tuition waived. Swiss living costs are high, so proof of funds is required.",
    minCgpa: 8.2,
    minSemester: 5,
    deadline: addDays(83),
    about: "Laboratory-heavy courses in solid-state physics and new materials, with access to a shared research facility.",
    courses: ["Solid State Physics", "Materials Characterisation", "Computational Physics Lab"],
    documents: [
      "Passport copy (valid for 18 months)",
      "Official transcript with CGPA",
      "Statement of purpose (500 words)",
      "Two faculty recommendation letters",
      "TOEFL or IELTS score report",
      "No-objection certificate from the university",
      "Proof of funds"
    ]
  }
];
