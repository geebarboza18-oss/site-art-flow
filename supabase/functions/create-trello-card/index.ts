import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestPayload {
  requestId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { requestId }: RequestPayload = await req.json();

    if (!requestId) {
      return new Response(
        JSON.stringify({ error: "Missing request ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const trelloApiKey = Deno.env.get("TRELLO_API_KEY");
    const trelloToken = Deno.env.get("TRELLO_TOKEN");
    const trelloListId = Deno.env.get("TRELLO_LIST_ID");

    if (!trelloApiKey || !trelloToken || !trelloListId) {
      return new Response(
        JSON.stringify({ error: "Trello configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: request, error: fetchError } = await supabase
      .from("design_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchError || !request) {
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cardName = `[${request.priority.toUpperCase()}] ${request.title}`;
    const cardDescription = `
**Solicitante:** ${request.requester_name} (${request.requester_email})
**Departamento:** ${request.department}
**Tipo:** ${request.request_type}

**Descrição:**
${request.description}

**Objetivo:**
${request.objective}

**Público-Alvo:**
${request.target_audience}

**Prazo:** ${request.deadline}
**Prioridade:** ${request.priority}

${request.dimensions ? `**Dimensões:** ${request.dimensions}\n` : ""}
${request.color_preferences ? `**Cores:** ${request.color_preferences}\n` : ""}
${request.reference_links ? `**Referências:** ${request.reference_links}\n` : ""}
${request.additional_notes ? `**Notas Adicionais:** ${request.additional_notes}\n` : ""}

---
ID da Solicitação: ${request.id}
`;

    const trelloUrl = `https://api.trello.com/1/cards?key=${trelloApiKey}&token=${trelloToken}`;
    const trelloPayload = {
      idList: trelloListId,
      name: cardName,
      desc: cardDescription,
      due: request.deadline,
      pos: "top",
    };

    const trelloResponse = await fetch(trelloUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(trelloPayload),
    });

    if (!trelloResponse.ok) {
      const errorText = await trelloResponse.text();
      return new Response(
        JSON.stringify({ error: "Failed to create Trello card", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const trelloCard = await trelloResponse.json();

    // Attach images to the Trello card if available
    if (request.reference_images && Array.isArray(request.reference_images) && request.reference_images.length > 0) {
      for (const imageUrl of request.reference_images) {
        try {
          const attachmentUrl = `https://api.trello.com/1/cards/${trelloCard.id}/attachments?key=${trelloApiKey}&token=${trelloToken}`;
          await fetch(attachmentUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: imageUrl,
            }),
          });
        } catch (attachError) {
          console.error("Error attaching image to Trello card:", attachError);
        }
      }
    }

    const { error: updateError } = await supabase
      .from("design_requests")
      .update({
        trello_card_id: trelloCard.id,
        trello_card_url: trelloCard.url,
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating request with Trello data:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cardId: trelloCard.id,
        cardUrl: trelloCard.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-trello-card function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});