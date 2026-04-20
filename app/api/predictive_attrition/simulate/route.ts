import { NextRequest, NextResponse } from "next/server";

type PredictiveAttritionSimulateRequest = {
  employee_id: number;
  new_salary: number;
  new_bonus?: number | null;
  new_category?: string | null;
};

type PredictiveAttritionSimulateItem = {
  id: number;
  probability: number;
  stays: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const body: PredictiveAttritionSimulateRequest = await req.json();

    const { employee_id, new_salary, new_bonus, new_category } = body;

    if (employee_id === undefined || employee_id === null) {
      return NextResponse.json(
        { detail: "employee_id es obligatorio" },
        { status: 400 }
      );
    }

    if (new_salary === undefined || new_salary === null) {
      return NextResponse.json(
        { detail: "new_salary es obligatorio" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      employee_id: String(employee_id),
      new_salary: String(new_salary),
    });

    if (new_bonus !== undefined && new_bonus !== null) {
      params.append("new_bonus", String(new_bonus));
    }

    if (new_category !== undefined && new_category !== null && new_category !== "") {
      params.append("new_category", new_category);
    }

    const backendBaseUrl= process.env.API_BASE_URL ?? "http://localhost:8001";

    if (!backendBaseUrl) {
      return NextResponse.json(
        { detail: "Falta configurar API_BASE_URL o NEXT_PUBLIC_API_BASE_URL" },
        { status: 500 }
      );
    }

    const url = `${backendBaseUrl}/predictive_attrition/simulate?${params.toString()}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Si necesitas token, aquí podrías propagar Authorization
        // Authorization: req.headers.get("authorization") ?? "",
      },
      cache: "no-store",
    });

    const data: PredictiveAttritionSimulateItem[] | { detail?: string } =
      await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          detail:
            typeof data === "object" && data && "detail" in data
              ? data.detail
              : "Error llamando al backend de simulación",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en /api/predictive_attrition/simulate:", error);

    return NextResponse.json(
      { detail: "Error interno del servidor" },
      { status: 500 }
    );
  }
}