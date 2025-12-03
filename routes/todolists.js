import express from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { validateDescription, validateId, validateBoolean } from "../utils/validation.js";

const router = express.Router();

// POST /api/todolists - Create a new todolist
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { description } = req.body;
    const validDescription = validateDescription(description);

    const todolist = await prisma.todolists.create({
      data: { description: validDescription },
      include: { subtasks: true },
    });

    res.status(201).json(todolist);
  })
);

// GET /api/todolists - Get all todolists
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const todolists = await prisma.todolists.findMany({
      include: { subtasks: true },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json(todolists);
  })
);

// GET /api/todolists/:id - Get a single todolist
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = validateId(req.params.id);

    const todolist = await prisma.todolists.findUniqueOrThrow({
      where: { id },
      include: { subtasks: true },
    });

    res.status(200).json(todolist);
  })
);

// PATCH /api/todolists/:id - Update a todolist
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

    // Optimization: Combine findUnique and update into single operation
    const updatedTodolist = await prisma.todolists.update({
      where: { id },
      data: updateData,
      include: { subtasks: true },
    });

    res.status(200).json(updatedTodolist);
  })
);

// DELETE /api/todolists/:id - Delete a todolist (with transaction)
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = validateId(req.params.id);

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // a. Check if todolist exists and get all subtasks
      const todolist = await tx.todolists.findUniqueOrThrow({
        where: { id },
        include: { subtasks: true },
      });

      // b. Save each subtask to deletedsubtasks
      if (todolist.subtasks.length > 0) {
        await tx.deletedsubtasks.createMany({
          data: todolist.subtasks.map((subtask) => ({
            original_id: subtask.id,
            description: subtask.description,
            original_todolist_id: id,
          })),
        });
      }

      // c. Delete all subtasks
      await tx.subtasks.deleteMany({
        where: { todolist_id: id },
      });

      // d. Save todolist to deletedtodolists
      await tx.deletedtodolists.create({
        data: {
          original_id: id,
          description: todolist.description,
        },
      });

      // e. Delete the todolist
      await tx.todolists.delete({
        where: { id },
      });
    });

    res.status(200).json({ success: true, message: "Todolist deleted successfully" });
  })
);

export default router;
