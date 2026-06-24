import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStage } from "@/lib/generated/prisma/enums";

export const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const { poNumber, description, estimatedDelivery } = body;

        if (!poNumber) {
            return NextResponse.json(
                { error: "PO Number is required" },
                { status: 400 },
            );
        }

        const newTask = await prisma.poTask.create({
            data: {
                poNumber,
                description,
                currentStage: "DRAWING",
                isCompleted: false,
                estimatedDelivery: estimatedDelivery
                    ? new Date(estimatedDelivery)
                    : null,
            },
        });
        return NextResponse.json(newTask, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const stage = (searchParams.get("stage") as TaskStage) || null;
        const isCompletedStr = searchParams.get("isCompleted");

        const whereClause: any = {};

        if (stage) {
            whereClause.currentStage = stage;
        }

        if (isCompletedStr !== null) {
            whereClause.isCompleted = isCompletedStr === "true";
        }

        const tasks = await prisma.poTask.findMany({
            where: whereClause,
            orderBy: {
                createdAt: "desc",
            },
        });

        const formattedTasks = tasks.map((task) => ({
            ...task,
            isOverdue:
                task.estimatedDelivery &&
                new Date(task.estimatedDelivery) < new Date() &&
                !task.isCompleted,
        }));
        return NextResponse.json(formattedTasks, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
};
