const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Create Users
  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      role: "ADMIN",
      password: "admin123",
    },
  });

  const johnDoeUser = await prisma.user.create({
    data: {
      username: "john_doe",
      role: "USER",
      password: "john123",
      createdBy: adminUser.id,
    },
  });

  // Create Uploads
  const formUpload = await prisma.upload.create({
    data: {
      name: "Form_20231222",
      type: "FORM",
      path: "upload/form_20231222.zip",
      status: "COMPLETED",
      userId: adminUser.id,
    },
  });

  const fichesSemaine15Upload = await prisma.upload.create({
    data: {
      name: "File_20231222",
      date: new Date("2023-12-22"),
      type: "FILE",
      status: "PENDING",
      path: "upload/fiches_de_semaine15.zip",
      userId: adminUser.id,
    },
  });

  const fichesSemaine16Upload = await prisma.upload.create({
    data: {
      name: "File_20231223",
      date: new Date("2023-12-23"),
      type: "FILE",
      status: "PROCESSING",
      path: "upload/fiches_de_semaine16.zip",
      userId: adminUser.id,
    },
  });

  // Create Sources
  const booksSource = await prisma.source.create({
    data: {
      name: "books",
      description: "ce source concerne les livres de la bibliothèque.",
    },
  });

  const fruitsSource = await prisma.source.create({
    data: {
      name: "fruits",
      description: "ce source concerne les fruits du marché.",
    },
  });

  // Create Dumps
  const booksDump1 = await prisma.dump.create({
    data: {
      name: "books_202312059999",
      dateCollect: new Date("2023-12-05"),
      sourceId: booksSource.id,
    },
  });

  const booksDump2 = await prisma.dump.create({
    data: {
      name: "books_202210018888",
      dateCollect: new Date("2022-10-01"),
      sourceId: booksSource.id,
    },
  });

  const fruitsDump1 = await prisma.dump.create({
    data: {
      name: "fruits_201005196666",
      dateCollect: new Date("2010-05-19"),
      sourceId: fruitsSource.id,
    },
  });

  const fruitsDump2 = await prisma.dump.create({
    data: {
      name: "fruits_201206185555",
      dateCollect: new Date("2012-06-18"),
      sourceId: fruitsSource.id,
    },
  });

  // Create Fiches
  const fiches = [];

  // Fiches for first upload (form_20231222)
  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche1",
        dateGenerate: new Date("2023-12-06"),
        name: "Fiche pour les livres des enfants",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche1/",
        dumpId: booksDump1.id,
        uploadId: formUpload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche2",
        dateGenerate: new Date("2023-12-06"),
        name: "Fiche pour les ouvrages",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche2/",
        dumpId: booksDump1.id,
        uploadId: formUpload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche3",
        dateGenerate: new Date("2023-12-06"),
        name: "Fiche pour les poésies",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche3/",
        dumpId: booksDump1.id,
        uploadId: formUpload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche4",
        dateGenerate: new Date("2022-10-01"),
        name: "Fiche pour les biographies",
        extension: "pdf",
        replacement: "fiches/books/20221001/Fiche4/",
        dumpId: booksDump2.id,
        uploadId: formUpload.id,
      },
    })
  );

  // Fiches for second upload (fiches_de_semaine15)
  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche5",
        dateGenerate: new Date("2010-05-19"),
        name: "Fiche pour les fruits de l'été",
        extension: "pdf",
        replacement: "fiches/fruits/20100519/Fiche5/",
        dumpId: fruitsDump1.id,
        uploadId: fichesSemaine15Upload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche6",
        dateGenerate: new Date("2010-05-19"),
        name: "Fiche pour les fruits du printemps",
        extension: "pdf",
        replacement: "fiches/fruits/20100519/Fiche6/",
        dumpId: fruitsDump1.id,
        uploadId: fichesSemaine15Upload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche7",
        dateGenerate: new Date("2010-05-19"),
        name: "Fiche pour les fruits de l'automne",
        extension: "pdf",
        replacement: "fiches/fruits/20100519/Fiche7/",
        dumpId: fruitsDump1.id,
        uploadId: fichesSemaine15Upload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche8",
        dateGenerate: new Date("2010-05-20"),
        name: "Fiche pour les fruits de l'hiver",
        extension: "pdf",
        replacement: "fiches/fruits/20100520/Fiche8/",
        dumpId: fruitsDump1.id,
        uploadId: fichesSemaine15Upload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche9",
        dateGenerate: new Date("2012-06-18"),
        name: "Fiche pour la pomme",
        extension: "pdf",
        replacement: "fiches/fruits/20120618/Fiche9/",
        dumpId: fruitsDump2.id,
        uploadId: fichesSemaine15Upload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche10",
        dateGenerate: new Date("2012-06-18"),
        name: "Fiche pour la banane",
        extension: "pdf",
        replacement: "fiches/fruits/20120618/Fiche10/",
        dumpId: fruitsDump2.id,
        uploadId: fichesSemaine15Upload.id,
      },
    })
  );

  // Fiches for third upload (fiches_de_semaine16)
  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche11",
        dateGenerate: new Date("2023-12-05"),
        name: "Fiche books example 1",
        extension: "pdf",
        replacement: "fiches/books/20231205/Fiche11/",
        dumpId: booksDump1.id,
        uploadId: fichesSemaine16Upload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche12",
        dateGenerate: new Date("2023-12-05"),
        name: "Fiche books example 2",
        extension: "pdf",
        replacement: "fiches/books/20231205/Fiche12/",
        dumpId: booksDump1.id,
        uploadId: fichesSemaine16Upload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche13",
        dateGenerate: new Date("2023-12-06"),
        name: "Fiche books example 3",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche13/",
        dumpId: booksDump1.id,
        uploadId: fichesSemaine16Upload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche14",
        dateGenerate: new Date("2010-05-19"),
        name: "Fiche fruits example 1",
        extension: "pdf",
        replacement: "fiches/fruits/20100519/Fiche14/",
        dumpId: fruitsDump1.id,
        uploadId: fichesSemaine16Upload.id,
      },
    })
  );

  fiches.push(
    await prisma.fiche.create({
      data: {
        ref: "Fiche15",
        dateGenerate: new Date("2010-05-19"),
        name: "Fiche fruits example 2",
        extension: "pdf",
        replacement: "fiches/fruits/20100519/Fiche15/",
        dumpId: fruitsDump1.id,
        uploadId: fichesSemaine16Upload.id,
      },
    })
  );

  // Link Observations
  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[0].id, // Fiche1 observes Fiche2
      observedId: fiches[1].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[0].id, // Fiche1 observes Fiche3
      observedId: fiches[2].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[0].id, // Fiche1 observes Fiche4
      observedId: fiches[3].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[1].id, // Fiche2 observes Fiche3
      observedId: fiches[2].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[1].id, // Fiche2 observes Fiche4
      observedId: fiches[3].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[4].id, // Fiche5 observes Fiche7
      observedId: fiches[6].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[4].id, // Fiche5 observes Fiche8
      observedId: fiches[7].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[4].id, // Fiche5 observes Fiche9
      observedId: fiches[8].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[4].id, // Fiche5 observes Fiche10
      observedId: fiches[9].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[5].id, // Fiche6 observes Fiche5
      observedId: fiches[4].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[5].id, // Fiche6 observes Fiche7
      observedId: fiches[6].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[5].id, // Fiche6 observes Fiche10
      observedId: fiches[9].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[6].id, // Fiche7 observes Fiche10
      observedId: fiches[9].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[10].id, // Fiche11 observes Fiche12
      observedId: fiches[11].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[10].id, // Fiche11 observes Fiche13
      observedId: fiches[12].id,
    },
  });

  await prisma.ficheRelation.create({
    data: {
      observerId: fiches[11].id, // Fiche12 observes Fiche13
      observedId: fiches[12].id,
    },
  });

  // Create Failed Fiches
  const failedFiches = [];

  failedFiches.push(
    await prisma.failedFiche.create({
      data: {
        uploadId: fichesSemaine16Upload.id,
        dumpId: booksDump1.id,
        path: "/failed/fiches/example_failed_1.zip",
        message: "Failed due to invalid data format.",
      },
    })
  );

  failedFiches.push(
    await prisma.failedFiche.create({
      data: {
        dateGenerate: new Date("2023-12-05"),
        dumpId: booksDump2.id,
        uploadId: fichesSemaine16Upload.id,
        path: "/failed/fiches/example_failed_2.zip",
        message: "Failed due to missing required fields.",
      },
    })
  );

  failedFiches.push(
    await prisma.failedFiche.create({
      data: {
        uploadId: fichesSemaine16Upload.id,
        path: null,
        message: "Failed due to server timeout during processing.",
      },
    })
  );

  failedFiches.push(
    await prisma.failedFiche.create({
      data: {
        uploadId: fichesSemaine16Upload.id,
        dumpId: fruitsDump1.id,
        path: "/failed/fiches/example_failed_4.zip",
        message: "Failed due to duplicate entry in the database.",
      },
    })
  );

  // Create NER Entries
  const nerEntries = [
    // Persons
    {
      name: "John Doe",
      category: "PERSON",
      description: "A fictional person.",
    },
    {
      name: "Jane Smith",
      category: "PERSON",
      description: "Another fictional person.",
    },
    {
      name: "Alice Johnson",
      category: "PERSON",
      description: "An example person.",
    },
    {
      name: "Bob Brown",
      category: "PERSON",
      description: "A sample individual.",
    },
    {
      name: "Charlie Davis",
      category: "PERSON",
      description: "A test subject.",
    },
    {
      name: "Eve White",
      category: "PERSON",
      description: "A placeholder name.",
    },
    {
      name: "Frank Wilson",
      category: "PERSON",
      description: "A random individual.",
    },
    { name: "Grace Lee", category: "PERSON", description: "A generic name." },

    // Organizations
    {
      name: "Acme Corp",
      category: "ORGANIZATION",
      description: "A fictional company.",
    },
    {
      name: "Globex Inc",
      category: "ORGANIZATION",
      description: "Another fictional organization.",
    },
    {
      name: "Umbrella Corp",
      category: "ORGANIZATION",
      description: "A well-known fictional company.",
    },
    {
      name: "Wayne Enterprises",
      category: "ORGANIZATION",
      description: "A DC Comics organization.",
    },
    {
      name: "Stark Industries",
      category: "ORGANIZATION",
      description: "A Marvel Comics company.",
    },
    {
      name: "LexCorp",
      category: "ORGANIZATION",
      description: "A Superman-related organization.",
    },

    // Locations
    {
      name: "New York City",
      category: "LOCATION",
      description: "A major city in the USA.",
    },
    {
      name: "Los Angeles",
      category: "LOCATION",
      description: "A city in California.",
    },
    {
      name: "Paris",
      category: "LOCATION",
      description: "The capital of France.",
    },
    {
      name: "Tokyo",
      category: "LOCATION",
      description: "The capital of Japan.",
    },
    {
      name: "London",
      category: "LOCATION",
      description: "The capital of the UK.",
    },
    {
      name: "Sydney",
      category: "LOCATION",
      description: "A city in Australia.",
    },
  ];

  const createdNers = await Promise.all(
    nerEntries.map((ner) => prisma.ner.create({ data: ner }))
  );

  // Link Fiches to NERs
  const nerPersonEntries = createdNers.filter(
    (ner) => ner.category === "PERSON"
  );
  const nerOrganizationEntries = createdNers.filter(
    (ner) => ner.category === "ORGANIZATION"
  );
  const nerLocationEntries = createdNers.filter(
    (ner) => ner.category === "LOCATION"
  );

  for (let i = 0; i < fiches.length; i++) {
    const fiche = fiches[i];

    // Link 3 Persons
    for (let j = 0; j < 3; j++) {
      const person = nerPersonEntries[(i + j) % nerPersonEntries.length];
      await prisma.ficheNer.create({
        data: {
          ficheId: fiche.id,
          nerId: person.id,
          description: `Relation between fiche ${fiche.ref} and person ${person.name}`,
        },
      });
    }

    // Link 2 Organizations
    for (let j = 0; j < 2; j++) {
      const organization =
        nerOrganizationEntries[(i + j) % nerOrganizationEntries.length];
      await prisma.ficheNer.create({
        data: {
          ficheId: fiche.id,
          nerId: organization.id,
          description: `Relation between fiche ${fiche.ref} and organization ${organization.name}`,
        },
      });
    }

    // Link 2 Locations
    for (let j = 0; j < 2; j++) {
      const location = nerLocationEntries[(i + j) % nerLocationEntries.length];
      await prisma.ficheNer.create({
        data: {
          ficheId: fiche.id,
          nerId: location.id,
          description: `Relation between fiche ${fiche.ref} and location ${location.name}`,
        },
      });
    }
  }

  // Create Documents
  const documents = [];

  documents.push(
    await prisma.document.create({
      data: {
        type: "FILE",
        name: "les enfants",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche1/Source/",
        ficheId: fiches[0].id, // Belongs to Fiche1 (upload 1)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "les garcons",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche1/Source/",
        ficheId: fiches[0].id, // Belongs to Fiche1 (upload 1)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "une histoire de la pensee rationnelle",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche2/Source/",
        ficheId: fiches[1].id, // Belongs to Fiche2 (upload 1)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "maternites particulieres",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche2/Source/",
        ficheId: fiches[1].id, // Belongs to Fiche2 (upload 1)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "vocabulaire clinique de l'analyse de groupe",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche2/Source/",
        ficheId: fiches[1].id, // Belongs to Fiche2 (upload 1)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "alchimie de la douleur",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche3/Source/",
        ficheId: fiches[2].id, // Belongs to Fiche3 (upload 1)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "au lecteur",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche3/Source/",
        ficheId: fiches[2].id, // Belongs to Fiche3 (upload 1)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "bien loin d'ici",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche3/Source/",
        ficheId: fiches[2].id, // Belongs to Fiche3 (upload 1)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "einstein his life and universe",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20221001/Fiche4/Source/",
        ficheId: fiches[3].id, // Belongs to Fiche4 (upload 1)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "alexander hamilton",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20221001/Fiche4/Source/",
        ficheId: fiches[3].id, // Belongs to Fiche4 (upload 1)
      },
    })
  );

  // Upload 2 Documents
  documents.push(
    await prisma.document.create({
      data: {
        name: "cerises",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20100519/Fiche5/Source/",
        ficheId: fiches[4].id, // Belongs to Fiche5 (upload 2)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "fraises",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20100519/Fiche5/Source/",
        ficheId: fiches[4].id, // Belongs to Fiche5 (upload 2)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "kiwi",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20100519/Fiche6/Source/",
        ficheId: fiches[5].id, // Belongs to Fiche6 (upload 2)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "avocat",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20100519/Fiche6/Source/",
        ficheId: fiches[5].id, // Belongs to Fiche6 (upload 2)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "pomme",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20100519/Fiche7/Source/",
        ficheId: fiches[6].id, // Belongs to Fiche7 (upload 2)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "ananas",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20100519/Fiche7/Source/",
        ficheId: fiches[6].id, // Belongs to Fiche7 (upload 2)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "citron",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20100520/Fiche8/Source/",
        ficheId: fiches[7].id, // Belongs to Fiche8 (upload 2)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "pamplemousse",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20100520/Fiche8/Source/",
        ficheId: fiches[7].id, // Belongs to Fiche8 (upload 2)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "bienfaits de la pomme",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20120618/Fiche9/Source/",
        ficheId: fiches[8].id, // Belongs to Fiche9 (upload 2)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "bienfaits de la banane",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20120618/Fiche10/Source/",
        ficheId: fiches[9].id, // Belongs to Fiche10 (upload 2)
      },
    })
  );

  // Upload 3 Documents
  documents.push(
    await prisma.document.create({
      data: {
        name: "example_1",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231205/Fiche11/Source/",
        ficheId: fiches[10].id, // Belongs to Fiche11 (upload 3)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "example_2",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231205/Fiche12/Source/",
        ficheId: fiches[11].id, // Belongs to Fiche12 (upload 3)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "example_3",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/books/20231206/Fiche13/Source/",
        ficheId: fiches[12].id, // Belongs to Fiche13 (upload 3)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "example_4",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/fruits/20100519/Fiche14/Source/",
        ficheId: fiches[13].id, // Belongs to Fiche14 (upload 3)
      },
    })
  );

  documents.push(
    await prisma.document.create({
      data: {
        name: "example_5",
        type: "FILE",
        extension: "pdf",
        replacement: "fiches/fruits/20100519/Fiche15/Source/",
        ficheId: fiches[14].id, // Belongs to Fiche15 (upload 3)
      },
    })
  );

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
