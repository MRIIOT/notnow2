import type { Server as SocketServer } from 'socket.io';
import { Task } from '../models/Task.js';
import { Notification } from '../models/Notification.js';
import { emitTeamEvent } from './socket.service.js';

/**
 * Check for due reminders and create notifications.
 * Runs on a 60-second interval.
 */
export function startReminderChecker(io: SocketServer) {
  async function check() {
    try {
      const now = new Date();

      // Find tasks with unsent reminders that are due
      const tasks = await Task.find({
        status: 'active',
        'reminders.sent': false,
        'reminders.date': { $lte: now },
      });

      for (const task of tasks) {
        for (const reminder of task.reminders) {
          if (reminder.sent || reminder.date > now) continue;

          // Create notifications for all assignees, or the creator if no assignees
          const targets = task.assignees.length > 0 ? task.assignees : [task.createdBy];

          for (const userId of targets) {
            await Notification.create({
              userId,
              teamId: task.teamId,
              type: 'reminder',
              title: `Reminder: ${task.title}`,
              message: task.dueDate
                ? `Due ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : '',
              taskId: task._id,
            });
          }

          reminder.sent = true;

          // Emit real-time notification
          emitTeamEvent(io, task.teamId.toString(), 'notification', { taskId: task._id });
        }

        await task.save();
      }
    } catch (err) {
      console.error('Reminder check error:', err);
    }
  }

  // Run every 60 seconds
  setInterval(check, 60_000);
  // Also run immediately on startup
  check();

  console.log('Reminder checker started');
}
