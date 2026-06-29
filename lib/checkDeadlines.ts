import { prisma } from "./prisma";
import { sendPushToAll } from "./sendPush";

const WARNING_DAYS_BEFORE = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function checkDeadlinesAndNotify() {
  const now = new Date()l
  const tasks = await prisma.poTask.findMany({
    where: { isCompleted: false },
  })

  for (const task of tasks) {
    const deadline = new Date(task.estimatedDelivery);
    const daysUntil = Math.ceil(
      (deadline.getTime() - now.getTime()) / MS_PER_DAY,
    );
    if (daysUntil < 0) {
          const daysOverdue = Math.abs(daysUntil);
          await sendPushToAll(
            `${task.poNumber} is overdue`,
            `Deadline passed ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} ago`,
            { taskId: task.id, type: "overdue" },
          );
        } else if (daysUntil === 0) {
          await sendPushToAll(
            `${task.poNumber} due today`,
            `This task is due today`,
            { taskId: task.id, type: "due_today" },
          );
        } else if (daysUntil <= WARNING_DAYS_BEFORE) {
          await sendPushToAll(
            `${task.poNumber} due soon`,
            `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
            { taskId: task.id, type: "approaching" },
          );
        }
  }
}
