import prisma from "@/lib/db";
import { format } from "date-fns";
import path from "path";
import { createDump, getDumpByName } from "@/lib/services/dumpService";
import { getSourceByName } from "@/lib/services/sourceService";
import { createFiche } from "@/lib/services/ficheService";
import {
  createDocument,
  getDocumentByHash,
} from "@/lib/services/documentService";

export async function ficheTransaction(data) {
  const {
    ficheFile,
    object,
    synthesis,
    dateGenerate,
    dumpName,
    sourceName,
    uploadId,
    documents,
    documentsData,
  } = data;

  try {
    const result = await prisma.$transaction(async (prisma) => {
      // Check dateGenerate
      const checkedDateGenerate = dateGenerate ? dateGenerate : new Date();
      // Transform date into yyyyMMdd format
      const formattedDateGenerate = format(new Date(), "yyyyMMdd");
      // Check if source is missing
      if (!sourceName) {
        throw new Error({ status: 400, message: "Source is missing." });
      }
      // Check if source exist
      const source = await getSourceByName(sourceName);
      if (!source) {
        throw new Error({
          status: 400,
          message: `No source found with the name '${sourceName}'.`,
        });
      }
      const sourceId = source.id;

      let dump;
      // Check if dump is missing
      if (!dumpName) {
        const generatedDumpName = `files-${sourceName}_${formattedDateGenerate}-manually`;

        dump = await createDump({
          name: generatedDumpName,
          description: `Dump belong to '${sourceName}'. Generated and inserted manually`,
          sourceId,
        });
      } else {
        // Check if dump is exist
        dump = await getDumpByName(dumpName);
        if (!dump) {
          dump = await createDump({
            name: dumpName,
            description: `Dump belong to '${sourceName}'. Inserted manually`,
            sourceId,
          });
        } else {
          // Validate that the dump belongs to the correct source
          if (dump.sourceId !== sourceId) {
            throw new Error({
              status: 400,
              message: `Dump '${dumpName}' is already linked to a different source.`,
            });
          }
        }
      }
      const dumpId = dump.id;

      // Create Ref
      const ref = `ABC-${Math.floor(Math.random() * 900) + 100}`;

      // Extract name, extension, replacement
      const ficheName = `Fiche de synthèse - ${object.slice(0, 15)}`;
      const ficheExtension = "pdf";
      const ficheReplacement = `fiches/${source}/${formattedDateGenerate}/${ref}/`;
      const documentReplacement = `${ficheReplacement}Source/`;

      // Insert fiche
      const fiche = await createFiche({
        object: object,
        synthesis: synthesis,
        dateGenerate: checkedDateGenerate,
        name: ficheName,
        extension: ficheExtension,
        replacement: ficheReplacement,
        dumpId,
        uploadId,
      });
      const ficheId = fiche.id;

      // Check for document duplication
      const hashes = new Set();
      for (const documentData of documentsData) {
        if (hashes.has(documentData?.hash)) {
          throw new Error({
            status: 400,
            message: `Duplicate document detected.`,
          });
        }
        seen.add(doc.hash);
      }
      // Insert documents
      for (const [index, documentData] of documentsData.entries()) {
        const { name, type, content, meta, extension, hash } = documentData;
        // Check if name is missing
        if (!name) {
          throw new Error({
            status: 500,
            message: `Name is required but missing from the ${
              index + 1
            } document.`,
          });
        }
        // Check if hash is missing
        if (!hash) {
          throw new Error({
            status: 500,
            message: `Hash value is required but missing from document '${name}'.`,
          });
        }
        // Check if type is missing
        if (!type) {
          throw new Error({
            status: 400,
            message: `Type value is required but missing from document '${name}'.`,
          });
        }
        // Check if type is valid
        if (!["FILE", "EMAIL", "ATTACHMENT"].includes(type)) {
          throw new Error({
            status: 400,
            message: `Unsupported document type '${type}'. Allowed types are: FILE, EMAIL, ATTACHMENT.`,
          });
        }
        // Check if document already exist by hash
        const document = await getDocumentByHash(hash);
        if (document) {
          throw new Error({
            status: 400,
            message: `Document '${name}' already exist.`,
          });
        }

        await createDocument({
          name,
          type,
          content,
          meta,
          extension,
          hash,
          replacement: documentReplacement,
          ficheId,
        });
      }

      return isDumpExist;
    });

    return result;
  } catch (error) {
    throw error;
  }
}
