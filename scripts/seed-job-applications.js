/**
 * Seed example Job Tracker data. Idempotent: skips any (company, position)
 * pair that already exists. Writes go through the repository, so MongoDB is
 * authoritative and DynamoDB gets the usual best-effort dual-write.
 *
 * Usage: node scripts/seed-job-applications.js
 */
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : ".env.local";
require("dotenv").config({ path: envFile, quiet: true });

const mongoClient = require("../db/db.js");
const jobApplicationsRepository = require("../repositories/jobApplications.repository.js");

const today = new Date().toISOString().slice(0, 10);

const EXAMPLES = [
  {
    company: "Globe",
    position: "Technology Intern",
    link: "https://globe.wd3.myworkdayjobs.com/en-US/GLB_Careers/userHome?source=LinkedIn",
    reference: "LinkedIn",
  },
  {
    company: "TP ICAP",
    position: "Internship 2026 - Manila - Technology",
    link: "https://tp.wd107.myworkdayjobs.com/TP-ICAP/job/Manila/Internship-2026--Manila--Technology_R5048?source=LinkedIn",
    reference: "LinkedIn",
  },
  {
    company: "WTW",
    position: "Intern",
    link: "https://eedu.fa.em3.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1003/my-profile",
  },
  {
    company: "Shopee",
    position: "Intern",
    link: "https://careers.shopee.sg/?channel=10001",
  },
  {
    company: "Payreto",
    position: "Intern",
    reference: "LinkedIn",
  },
  {
    company: "Manulife",
    position: "Intern",
    link: "https://manulife.wd3.myworkdayjobs.com/en-US/MFCJH_Jobs/userHome?Job_Application_ID=41c5a276b912902cf574b90697df0001",
  },
  {
    company: "Analog Devices",
    position: "Intern",
    link: "https://analogdevices.wd1.myworkdayjobs.com/en-US/External/userHome",
  },
  {
    company: "Trend Micro",
    position: "Intern",
    link: "https://trendmicro.wd3.myworkdayjobs.com/en-US/External/userHome",
  },
  {
    company: "OpenText",
    position: "Systems Integration Student Intern (6-month program)",
    link: "https://career17.sapsf.com/portalcareer?company=Opentext",
  },
  {
    company: "UL Solutions",
    position: "Intern",
    link: "https://fa-eups-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/ULSolutionsCareers/my-profile",
  },
  {
    company: "Unilab",
    position: "Intern",
    link: "https://unilab.darwinbox.com/ms/candidatev2/careers/myJobs/applied?jobId=a6a4b4851b1b63",
  },
  {
    company: "Infobip",
    position: "Intern",
    link: "https://infobip.wd3.myworkdayjobs.com/en-US/InfobipCareers/userHome",
  },
  {
    company: "Monee (Maribank)",
    position: "Intern",
    link: "https://careers.monee.com/apply?id=J02160817&source_from=1",
  },
  {
    company: "CloudConsole",
    position: "Website Developer Intern",
    link: "https://jobs.cvviz.com/cloudconsole/job_82067_Website_Developer_Intern_at_CloudConsole?utm_source=Linkedin",
    reference: "LinkedIn",
  },
];

(async () => {
  console.log(`Seeding job applications using ${envFile}`);

  const existing = await jobApplicationsRepository.getAll();
  const seen = new Set(
    existing.map((j) => `${j.company}::${j.position}`.toLowerCase())
  );

  let inserted = 0;
  for (const example of EXAMPLES) {
    const key = `${example.company}::${example.position}`.toLowerCase();
    if (seen.has(key)) {
      console.log(`  skip ${example.company} — already exists`);
      continue;
    }
    const { newId } = require("../repositories/repository.util.js");
    await jobApplicationsRepository.create({
      company: example.company,
      position: example.position,
      dateApplied: today,
      status: "applied",
      link: example.link || "",
      reference: example.reference || "",
      notes: "",
      stages: [
        {
          id: newId(),
          title: "Applied",
          ...(example.link ? { link: example.link } : {}),
          body: "Application submitted.",
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    inserted += 1;
    console.log(`  inserted ${example.company} — ${example.position}`);
  }

  console.log(`\nDone: ${inserted} inserted, ${EXAMPLES.length - inserted} skipped.`);
  await mongoClient.close();
  process.exit(0);
})().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
