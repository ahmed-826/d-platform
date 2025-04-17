import { NextResponse } from "next/server";
import { createFichePDF } from "@/lib/functions/createPDF";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const type = formData.get("type");
    if (!type) {
      return NextResponse.json({ message: "Missing type" }, { status: 400 });
    }
    if (!["FORM", "FILE", "API"].includes(type)) {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    createFichePDF(date, source, object, synthesis);

    const source = "";
    const dump = "";

    if (type === "FORM") {
      const name = formData.get("name");
      const source = formData.get("source");
      const dump = formData.get("dump");
      const object = formData.get("object");
      const synthesis = formData.get("synthesis");

      // Create and upload zipFile,

      const generatedName = `${
        name ? name + "-" : ""
      }Formulaire-${source}-${new Date().toLocaleDateString()}`;

      if (!dump) {
        const generatedDump = `Dump-${source}-${new Date().toLocaleDateString()}`;
        const dumpData = {
          name: generatedDump,
          description: "Formulaire",
          sourceId: source,
        };
        const newDump = await createDump(dumpData);
      }
    }

    // Return the new upload ID as a response
    return new Response(JSON.stringify({ id: "id passed" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling form submission:", error);

    return new Response(
      JSON.stringify({ message: "Failed to create upload" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
