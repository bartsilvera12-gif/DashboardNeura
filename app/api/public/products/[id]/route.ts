import { NextRequest } from "next/server";
import {
  getCompanyFromApiKey,
  jsonResponse,
  optionsResponse,
} from "@/lib/api/public-api";
import {
  deleteProductPublic,
  updateProductPublic,
} from "@/lib/config/public-api-products-mutations";
import { logApiRequest } from "@/lib/config/api-logs-service";

export async function OPTIONS() {
  return optionsResponse();
}

async function handlePatchOrPut(
  request: NextRequest,
  params: Promise<{ id: string }>,
  method: "PATCH" | "PUT"
) {
  const { id: productId } = await params;
  const endpoint = `/api/public/products/${productId ?? "[id]"}`;
  const auth = await getCompanyFromApiKey(request);
  if (!auth.ok) {
    logApiRequest({
      companyId: null,
      endpoint,
      method,
      statusCode: auth.status,
      success: false,
      errorMessage: auth.body?.error,
    });
    return jsonResponse(auth.body, auth.status);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method,
      statusCode: 400,
      success: false,
      errorMessage: "JSON inválido",
    });
    return jsonResponse({ error: "Cuerpo JSON inválido" }, 400);
  }

  const result = await updateProductPublic(auth.companyId, productId, body);
  if (!result.ok) {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method,
      statusCode: result.status,
      success: false,
      errorMessage: result.error,
    });
    return jsonResponse({ error: result.error }, result.status);
  }

  logApiRequest({
    companyId: auth.companyId,
    endpoint,
    method,
    statusCode: 200,
    success: true,
  });
  return jsonResponse({ ok: true, product: result.product });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handlePatchOrPut(request, context.params, "PATCH");
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handlePatchOrPut(request, context.params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await context.params;
  const endpoint = `/api/public/products/${productId ?? "[id]"}`;
  const auth = await getCompanyFromApiKey(request);
  if (!auth.ok) {
    logApiRequest({
      companyId: null,
      endpoint,
      method: "DELETE",
      statusCode: auth.status,
      success: false,
      errorMessage: auth.body?.error,
    });
    return jsonResponse(auth.body, auth.status);
  }

  const result = await deleteProductPublic(auth.companyId, productId);
  if (!result.ok) {
    logApiRequest({
      companyId: auth.companyId,
      endpoint,
      method: "DELETE",
      statusCode: result.status,
      success: false,
      errorMessage: result.error,
    });
    return jsonResponse({ error: result.error }, result.status);
  }

  logApiRequest({
    companyId: auth.companyId,
    endpoint,
    method: "DELETE",
    statusCode: 200,
    success: true,
  });
  return jsonResponse({ ok: true });
}
