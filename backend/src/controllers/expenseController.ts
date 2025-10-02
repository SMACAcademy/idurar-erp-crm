import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ApiResponse } from '../types/response';
import { PgType, EntryType, PaymentMethod } from '@prisma/client';
import path from 'path';

export const addExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { entryType, amount, date, partyName, paymentType, remarks, pgId } = req.body;
    const adminId = req.admin!.id;

    // Handle file uploads for bills (up to 3 files)
    let attachedBill1, attachedBill2, attachedBill3;
    
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      // Convert file paths to web-accessible URLs with forward slashes
      if (files[0]) {
        const filePath = files[0].path || files[0].filename;
        attachedBill1 = '/' + filePath.replace(/\\/g, '/');
      }
      if (files[1]) {
        const filePath = files[1].path || files[1].filename;
        attachedBill2 = '/' + filePath.replace(/\\/g, '/');
      }
      if (files[2]) {
        const filePath = files[2].path || files[2].filename;
        attachedBill3 = '/' + filePath.replace(/\\/g, '/');
      }
    }

    const expense = await prisma.expense.create({
      data: {
        entryType: entryType as EntryType,
        amount: parseFloat(amount),
        date: new Date(date),
        partyName,
        paymentType: paymentType as PaymentMethod,
        remarks: remarks || null,
        attachedBill1,
        attachedBill2,
        attachedBill3,
        createdBy: adminId,
        pgId,
      },
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        pg: {
          select: { id: true, name: true, type: true, location: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};

export const getExpenses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      pgId, 
      entryType, 
      startDate, 
      endDate,
      paymentType,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page as string);
    const pageSize = parseInt(limit as string);
    const skip = (pageNumber - 1) * pageSize;

    // Build filter conditions
    const whereConditions: any = {};

    if (pgId) {
      whereConditions.pgId = pgId as string;
    }

    if (entryType) {
      whereConditions.entryType = entryType as EntryType;
    }

    if (paymentType) {
      whereConditions.paymentType = paymentType as PaymentMethod;
    }

    if (startDate || endDate) {
      whereConditions.date = {};
      if (startDate) {
        whereConditions.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereConditions.date.lte = new Date(endDate as string);
      }
    }

    // Get total count for pagination
    const totalExpenses = await prisma.expense.count({
      where: whereConditions
    });

    // Get expenses with pagination and sorting
    const expenses = await prisma.expense.findMany({
      where: whereConditions,
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        pg: {
          select: { id: true, name: true, type: true, location: true }
        }
      },
      orderBy: {
        [sortBy as string]: sortOrder as 'asc' | 'desc'
      },
      skip,
      take: pageSize
    });

    // Flatten the expense data structure
    const flattenedExpenses = expenses.map(expense => ({
      id: expense.id,
      entryType: expense.entryType,
      amount: expense.amount,
      date: expense.date,
      partyName: expense.partyName,
      paymentType: expense.paymentType,
      remarks: expense.remarks,
      attachedBill1: expense.attachedBill1,
      attachedBill2: expense.attachedBill2,
      attachedBill3: expense.attachedBill3,
      createdBy: expense.createdBy,
      pgId: expense.pgId,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      // Flattened admin fields
      adminId: expense.admin.id,
      adminName: expense.admin.name,
      adminEmail: expense.admin.email,
      // Flattened PG fields
      pgName: expense.pg.name,
      pgType: expense.pg.type,
      pgLocation: expense.pg.location
    }));

    const totalPages = Math.ceil(totalExpenses / pageSize);

    res.status(200).json({
      success: true,
      message: 'Expenses retrieved successfully',
      data: flattenedExpenses,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalExpenses,
        totalPages
      }
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};

export const getExpenseById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        pg: {
          select: { id: true, name: true, type: true, location: true }
        }
      }
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      } as ApiResponse<null>);
    }

    res.status(200).json({
      success: true,
      message: 'Expense retrieved successfully',
      data: expense
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};

export const updateExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { entryType, amount, date, partyName, paymentType, remarks } = req.body;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      } as ApiResponse<null>);
    }

    // Handle file uploads for bills (up to 3 files)
    let updateData: any = {
      entryType: entryType as EntryType,
      amount: parseFloat(amount),
      date: new Date(date),
      partyName,
      paymentType: paymentType as PaymentMethod,
      remarks: remarks || null,
    };

    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      // Convert file paths to web-accessible URLs with forward slashes
      if (files[0]) {
        const filePath = files[0].path || files[0].filename;
        updateData.attachedBill1 = '/' + filePath.replace(/\\/g, '/');
      }
      if (files[1]) {
        const filePath = files[1].path || files[1].filename;
        updateData.attachedBill2 = '/' + filePath.replace(/\\/g, '/');
      }
      if (files[2]) {
        const filePath = files[2].path || files[2].filename;
        updateData.attachedBill3 = '/' + filePath.replace(/\\/g, '/');
      }
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        pg: {
          select: { id: true, name: true, type: true, location: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};

export const deleteExpense = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      } as ApiResponse<null>);
    }

    await prisma.expense.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse<null>);
  }
};