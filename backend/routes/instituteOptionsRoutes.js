import express from 'express';
import db from '../database/dbClient.js';
const router = express.Router();

router.get('/get', async (req, res) => {
  try {
    console.log('📊 Fetching complete data from boards, mediums, and schools tables');

    // Execute all queries in parallel using Promise.all for better performance
    const [boardsResult, mediumsResult, schoolsResult] = await Promise.all([
      // Get all boards
      db.queryMany(`
        SELECT 
          id, 
          name, 
          full_name, 
          description, 
          is_active, 
          created_at
        FROM boards 
        ORDER BY name ASC
      `),

      // Get all mediums
      db.queryMany(`
        SELECT 
          id, 
          name, 
          is_active, 
          created_at
        FROM mediums 
        ORDER BY name ASC
      `),

      // Get all schools with their associated board information
      db.queryMany(`
        SELECT 
          s.id,
          s.name,
          s.code,
          s.board_id,
          s.address,
          s.city,
          s.state,
          s.pincode,
          s.contact_phone,
          s.contact_email,
          s.is_active,
          s.created_at,
          b.name as board_name,
          b.full_name as board_full_name
        FROM schools s
        LEFT JOIN boards b ON s.board_id = b.id
        ORDER BY s.name ASC
      `)
    ]);

    // Get statistics for each table
    const [boardsStats, mediumsStats, schoolsStats] = await Promise.all([
      db.queryOne('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM boards'),
      db.queryOne('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM mediums'),
      db.queryOne('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM schools')
    ]);

    // Group schools by board for better organization
    const schoolsByBoard = {};
    schoolsResult.forEach(school => {
      const boardKey = school.board_id;
      if (!schoolsByBoard[boardKey]) {
        schoolsByBoard[boardKey] = {
          board_id: school.board_id,
          board_name: school.board_name,
          board_full_name: school.board_full_name,
          schools: []
        };
      }
      
      // Remove board info from individual school object to avoid redundancy
      const { board_name, board_full_name, ...schoolData } = school;
      schoolsByBoard[boardKey].schools.push(schoolData);
    });

    // Convert schools by board object to array
    const schoolsGroupedByBoard = Object.values(schoolsByBoard);

    // Prepare the complete response
    const response = {
      success: true,
      message: 'Data fetched successfully',
      timestamp: new Date().toISOString(),
      statistics: {
        boards: {
          total: parseInt(boardsStats.total),
          active: parseInt(boardsStats.active),
          inactive: parseInt(boardsStats.total) - parseInt(boardsStats.active)
        },
        mediums: {
          total: parseInt(mediumsStats.total),
          active: parseInt(mediumsStats.active),
          inactive: parseInt(mediumsStats.total) - parseInt(mediumsStats.active)
        },
        schools: {
          total: parseInt(schoolsStats.total),
          active: parseInt(schoolsStats.active),
          inactive: parseInt(schoolsStats.total) - parseInt(schoolsStats.active)
        }
      },
      data: {
        boards: boardsResult,
        mediums: mediumsResult,
        schools: schoolsResult,
        schools_grouped_by_board: schoolsGroupedByBoard
      }
    };

    console.log('✅ Complete data fetched successfully:', {
      boards: boardsResult.length,
      mediums: mediumsResult.length,
      schools: schoolsResult.length
    });

    res.json(response);

  } catch (error) {
    console.error('💥 Error fetching complete data:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Optional: Add individual endpoints for each table
router.get('/boards', async (req, res) => {
  try {
    const { active_only } = req.query;
    
    let query = `
      SELECT id, name, full_name, description, is_active, created_at
      FROM boards
    `;
    
    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY name ASC';
    
    const boards = await db.queryMany(query);
    
    res.json({
      success: true,
      message: 'Boards fetched successfully',
      count: boards.length,
      data: boards
    });
    
  } catch (error) {
    console.error('💥 Error fetching boards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch boards'
    });
  }
});

router.get('/mediums', async (req, res) => {
  try {
    const { active_only } = req.query;
    
    let query = `
      SELECT id, name, is_active, created_at
      FROM mediums
    `;
    
    if (active_only === 'true') {
      query += ' WHERE is_active = true';
    }
    
    query += ' ORDER BY name ASC';
    
    const mediums = await db.queryMany(query);
    
    res.json({
      success: true,
      message: 'Mediums fetched successfully',
      count: mediums.length,
      data: mediums
    });
    
  } catch (error) {
    console.error('💥 Error fetching mediums:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mediums'
    });
  }
});

router.get('/schools', async (req, res) => {
  try {
    const { active_only, board_id, city, state } = req.query;
    
    let query = `
      SELECT 
        s.id, s.name, s.code, s.board_id, s.address, s.city, s.state,
        s.pincode, s.contact_phone, s.contact_email, s.is_active, s.created_at,
        b.name as board_name, b.full_name as board_full_name
      FROM schools s
      LEFT JOIN boards b ON s.board_id = b.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (active_only === 'true') {
      query += ' AND s.is_active = true';
    }
    
    if (board_id) {
      paramCount++;
      query += ` AND s.board_id = $${paramCount}`;
      params.push(parseInt(board_id));
    }
    
    if (city) {
      paramCount++;
      query += ` AND LOWER(s.city) = LOWER($${paramCount})`;
      params.push(city);
    }
    
    if (state) {
      paramCount++;
      query += ` AND LOWER(s.state) = LOWER($${paramCount})`;
      params.push(state);
    }
    
    query += ' ORDER BY s.name ASC';
    
    const schools = await db.queryMany(query, params);
    
    res.json({
      success: true,
      message: 'Schools fetched successfully',
      count: schools.length,
      filters: { active_only, board_id, city, state },
      data: schools
    });
    
  } catch (error) {
    console.error('💥 Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools'
    });
  }
});

export default router;