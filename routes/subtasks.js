import express from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateDescription, validateId, validateBoolean } from "../utils/validation.js";

const router = express.Router();

// POST /api/todolists/:todolistId/subtasks - Create a new subtask
router.post(
  "/todolists/:todolistId/subtasks",
  asyncHandler(async (req, res) => {
    const todolistId = validateId(req.params.todolistId);
    const { description } = req.body;
    const validDescription = validateDescription(description);

    // Check if todolist exists in transaction
    const subtask = await prisma.$transaction(async (tx) => {
      await tx.todolists.findUniqueOrThrow({
        where: { id: todolistId },
      });

      return tx.subtasks.create({
        data: {
          description: validDescription,
          todolist_id: todolistId,
        },
      });
    });

    res.status(201).json(subtask);
  })
);

// PATCH /api/subtasks/:id - Update a subtask
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = validateId(req.params.id);
    const { description, isdone } = req.body;

    // Build update data
    const updateData = {};
    if (description !== undefined) {
      updateData.description = validateDescription(description);
    }
    if (isdone !== undefined) {
      updateData.isdone = validateBoolean(isdone);
    }
    // Always set updated_at to current time
    updateData.updated_at = new Date();

    const updatedSubtask = await prisma.subtasks.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json(updatedSubtask);
  })
);

// DELETE /api/subtasks/:id - Delete a subtask (with transaction)
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = validateId(req.params.id);

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // a. Check if subtask exists
      const subtask = await tx.subtasks.findUniqueOrThrow({
        where: { id },
      });

      // b. Save subtask to deletedsubtasks
      await tx.deletedsubtasks.create({
        data: {
          original_id: id,
          description: subtask.description,
          original_todolist_id: subtask.todolist_id,
        },
      });

      // c. Delete the subtask
      await tx.subtasks.delete({
        where: { id },
      });
    });

    res.status(200).json({ success: true, message: "Subtask deleted successfully" });
  })
);

export default router;
