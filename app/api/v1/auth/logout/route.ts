import { crearClienteServidor } from "@/lib/supabase/server";
import { toProblem } from "@/server/http/problem";

export async function POST(request: Request) {
  try {
    const supabase = await crearClienteServidor();
    await supabase.auth.signOut();
    return new Response(null, { status: 204 });
  } catch (error) {
    return toProblem(error, request);
  }
}
