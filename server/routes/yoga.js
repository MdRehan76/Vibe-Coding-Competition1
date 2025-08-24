const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Sample yoga poses data
const yogaPoses = [
  {
    id: 1,
    name: 'Mountain Pose (Tadasana)',
    sanskrit: 'Tadasana',
    category: 'standing',
    difficulty: 'beginner',
    duration: 30,
    benefits: ['Improves posture', 'Strengthens thighs and core', 'Increases awareness'],
    instructions: [
      'Stand with feet together, arms at sides',
      'Lift and spread toes, then place them back down',
      'Engage thigh muscles and lift kneecaps',
      'Draw in lower belly and lift chest',
      'Relax shoulders and extend arms down',
      'Hold for 30 seconds to 1 minute'
    ],
    image: 'https://example.com/mountain-pose.jpg',
    video: 'https://example.com/mountain-pose-video.mp4'
  },
  {
    id: 2,
    name: 'Downward-Facing Dog (Adho Mukha Svanasana)',
    sanskrit: 'Adho Mukha Svanasana',
    category: 'inversion',
    difficulty: 'beginner',
    duration: 60,
    benefits: ['Strengthens arms and legs', 'Stretches shoulders and hamstrings', 'Calms the mind'],
    instructions: [
      'Start on hands and knees',
      'Lift hips up and back',
      'Press hands into mat and lift hips',
      'Straighten legs as much as possible',
      'Keep head between arms',
      'Hold for 1-3 minutes'
    ],
    image: 'https://example.com/downward-dog.jpg',
    video: 'https://example.com/downward-dog-video.mp4'
  },
  {
    id: 3,
    name: 'Warrior I (Virabhadrasana I)',
    sanskrit: 'Virabhadrasana I',
    category: 'standing',
    difficulty: 'intermediate',
    duration: 45,
    benefits: ['Strengthens legs and core', 'Opens chest and shoulders', 'Improves balance'],
    instructions: [
      'Step one foot back into a lunge',
      'Turn back foot out 45 degrees',
      'Bend front knee to 90 degrees',
      'Lift arms overhead',
      'Square hips to front',
      'Hold for 30-60 seconds each side'
    ],
    image: 'https://example.com/warrior-1.jpg',
    video: 'https://example.com/warrior-1-video.mp4'
  },
  {
    id: 4,
    name: 'Tree Pose (Vrksasana)',
    sanskrit: 'Vrksasana',
    category: 'balancing',
    difficulty: 'beginner',
    duration: 30,
    benefits: ['Improves balance', 'Strengthens legs', 'Focuses the mind'],
    instructions: [
      'Stand on one leg',
      'Place other foot on inner thigh or calf',
      'Bring hands to prayer position',
      'Focus on a point ahead',
      'Keep standing leg strong',
      'Hold for 30-60 seconds each side'
    ],
    image: 'https://example.com/tree-pose.jpg',
    video: 'https://example.com/tree-pose-video.mp4'
  },
  {
    id: 5,
    name: 'Child\'s Pose (Balasana)',
    sanskrit: 'Balasana',
    category: 'restorative',
    difficulty: 'beginner',
    duration: 120,
    benefits: ['Relieves back pain', 'Calms the mind', 'Stretches hips and thighs'],
    instructions: [
      'Kneel on mat with big toes touching',
      'Sit back on heels',
      'Fold forward, extending arms',
      'Rest forehead on mat',
      'Relax and breathe deeply',
      'Hold for 1-3 minutes'
    ],
    image: 'https://example.com/childs-pose.jpg',
    video: 'https://example.com/childs-pose-video.mp4'
  },
  {
    id: 6,
    name: 'Cobra Pose (Bhujangasana)',
    sanskrit: 'Bhujangasana',
    category: 'backbend',
    difficulty: 'beginner',
    duration: 30,
    benefits: ['Strengthens back muscles', 'Opens chest', 'Improves posture'],
    instructions: [
      'Lie face down on mat',
      'Place hands under shoulders',
      'Press into hands and lift chest',
      'Keep pelvis on mat',
      'Look forward or slightly up',
      'Hold for 15-30 seconds'
    ],
    image: 'https://example.com/cobra-pose.jpg',
    video: 'https://example.com/cobra-pose-video.mp4'
  },
  {
    id: 7,
    name: 'Bridge Pose (Setu Bandhasana)',
    sanskrit: 'Setu Bandhasana',
    category: 'backbend',
    difficulty: 'beginner',
    duration: 45,
    benefits: ['Strengthens back and glutes', 'Opens chest', 'Calms the mind'],
    instructions: [
      'Lie on back with knees bent',
      'Place feet hip-width apart',
      'Press into feet and lift hips',
      'Interlace hands under back',
      'Roll shoulders under',
      'Hold for 30-60 seconds'
    ],
    image: 'https://example.com/bridge-pose.jpg',
    video: 'https://example.com/bridge-pose-video.mp4'
  },
  {
    id: 8,
    name: 'Seated Forward Bend (Paschimottanasana)',
    sanskrit: 'Paschimottanasana',
    category: 'forward-bend',
    difficulty: 'intermediate',
    duration: 60,
    benefits: ['Stretches hamstrings', 'Calms the mind', 'Relieves stress'],
    instructions: [
      'Sit with legs extended',
      'Fold forward from hips',
      'Reach for feet or ankles',
      'Keep back straight',
      'Breathe deeply',
      'Hold for 1-3 minutes'
    ],
    image: 'https://example.com/seated-forward-bend.jpg',
    video: 'https://example.com/seated-forward-bend-video.mp4'
  }
];

// Get all yoga poses
router.get('/poses', async (req, res) => {
  try {
    const { category, difficulty, limit } = req.query;
    
    let filteredPoses = [...yogaPoses];
    
    if (category) {
      filteredPoses = filteredPoses.filter(pose => pose.category === category);
    }
    
    if (difficulty) {
      filteredPoses = filteredPoses.filter(pose => pose.difficulty === difficulty);
    }
    
    if (limit) {
      filteredPoses = filteredPoses.slice(0, parseInt(limit));
    }
    
    res.json({ poses: filteredPoses });
  } catch (error) {
    console.error('Get yoga poses error:', error);
    res.status(500).json({ error: 'Failed to get yoga poses' });
  }
});

// Get yoga pose by ID
router.get('/poses/:id', async (req, res) => {
  try {
    const poseId = parseInt(req.params.id);
    const pose = yogaPoses.find(p => p.id === poseId);
    
    if (!pose) {
      return res.status(404).json({ error: 'Yoga pose not found' });
    }
    
    res.json({ pose });
  } catch (error) {
    console.error('Get yoga pose error:', error);
    res.status(500).json({ error: 'Failed to get yoga pose' });
  }
});

// Get yoga sessions for user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    let query = 'SELECT * FROM yoga_sessions WHERE user_id = ?';
    const queryParams = [userId];

    if (start_date) {
      query += ' AND DATE(completed_at) >= ?';
      queryParams.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(completed_at) <= ?';
      queryParams.push(end_date);
    }

    query += ' ORDER BY completed_at DESC';

    const [sessions] = await pool.execute(query, queryParams);

    res.json({ sessions });
  } catch (error) {
    console.error('Get yoga sessions error:', error);
    res.status(500).json({ error: 'Failed to get yoga sessions' });
  }
});

// Add yoga session
router.post('/sessions', authenticateToken, [
  body('pose_name').trim().isLength({ min: 1, max: 255 }).withMessage('Pose name is required'),
  body('duration_minutes').isInt({ min: 1, max: 180 }).withMessage('Duration must be between 1-180 minutes'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pose_name, duration_minutes, notes } = req.body;
    const userId = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO yoga_sessions (user_id, pose_name, duration_minutes, notes) VALUES (?, ?, ?, ?)',
      [userId, pose_name, duration_minutes, notes]
    );

    const sessionId = result.insertId;

    // Get the created session
    const [sessions] = await pool.execute(
      'SELECT * FROM yoga_sessions WHERE id = ?',
      [sessionId]
    );

    res.status(201).json({
      message: 'Yoga session recorded successfully',
      session: sessions[0]
    });

  } catch (error) {
    console.error('Add yoga session error:', error);
    res.status(500).json({ error: 'Failed to add yoga session' });
  }
});

// Get yoga statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total sessions
    const [totalSessions] = await pool.execute(
      'SELECT COUNT(*) as total FROM yoga_sessions WHERE user_id = ?',
      [userId]
    );

    // Get total duration
    const [totalDuration] = await pool.execute(
      'SELECT SUM(duration_minutes) as total FROM yoga_sessions WHERE user_id = ?',
      [userId]
    );

    // Get sessions this week
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [weeklySessions] = await pool.execute(
      'SELECT COUNT(*) as count FROM yoga_sessions WHERE user_id = ? AND DATE(completed_at) >= ?',
      [userId, weekStart]
    );

    // Get sessions this month
    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [monthlySessions] = await pool.execute(
      'SELECT COUNT(*) as count FROM yoga_sessions WHERE user_id = ? AND DATE(completed_at) >= ?',
      [userId, monthStart]
    );

    // Get most practiced poses
    const [popularPoses] = await pool.execute(
      'SELECT pose_name, COUNT(*) as count FROM yoga_sessions WHERE user_id = ? GROUP BY pose_name ORDER BY count DESC LIMIT 5',
      [userId]
    );

    // Get average session duration
    const [avgDuration] = await pool.execute(
      'SELECT AVG(duration_minutes) as average FROM yoga_sessions WHERE user_id = ?',
      [userId]
    );

    const stats = {
      totalSessions: totalSessions[0].total,
      totalDuration: totalDuration[0].total || 0,
      weeklySessions: weeklySessions[0].count,
      monthlySessions: monthlySessions[0].count,
      averageDuration: Math.round(avgDuration[0].average || 0),
      popularPoses
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get yoga stats error:', error);
    res.status(500).json({ error: 'Failed to get yoga statistics' });
  }
});

// Get yoga routines
router.get('/routines', async (req, res) => {
  try {
    const routines = [
      {
        id: 1,
        name: 'Morning Flow',
        duration: 15,
        difficulty: 'beginner',
        description: 'A gentle morning routine to wake up your body and mind',
        poses: [
          { pose: yogaPoses[0], duration: 30 }, // Mountain Pose
          { pose: yogaPoses[1], duration: 60 }, // Downward Dog
          { pose: yogaPoses[4], duration: 120 }, // Child's Pose
          { pose: yogaPoses[5], duration: 30 }, // Cobra Pose
          { pose: yogaPoses[4], duration: 60 }  // Child's Pose
        ]
      },
      {
        id: 2,
        name: 'Strength Builder',
        duration: 30,
        difficulty: 'intermediate',
        description: 'Build strength and improve balance',
        poses: [
          { pose: yogaPoses[0], duration: 30 }, // Mountain Pose
          { pose: yogaPoses[2], duration: 45 }, // Warrior I
          { pose: yogaPoses[3], duration: 30 }, // Tree Pose
          { pose: yogaPoses[6], duration: 45 }, // Bridge Pose
          { pose: yogaPoses[1], duration: 60 }, // Downward Dog
          { pose: yogaPoses[4], duration: 60 }  // Child's Pose
        ]
      },
      {
        id: 3,
        name: 'Relaxation Sequence',
        duration: 20,
        difficulty: 'beginner',
        description: 'A calming sequence to reduce stress and tension',
        poses: [
          { pose: yogaPoses[4], duration: 120 }, // Child's Pose
          { pose: yogaPoses[6], duration: 45 }, // Bridge Pose
          { pose: yogaPoses[7], duration: 120 }, // Seated Forward Bend
          { pose: yogaPoses[4], duration: 120 } // Child's Pose
        ]
      }
    ];

    res.json({ routines });
  } catch (error) {
    console.error('Get yoga routines error:', error);
    res.status(500).json({ error: 'Failed to get yoga routines' });
  }
});

// Get yoga routine by ID
router.get('/routines/:id', async (req, res) => {
  try {
    const routineId = parseInt(req.params.id);
    
    const routines = [
      {
        id: 1,
        name: 'Morning Flow',
        duration: 15,
        difficulty: 'beginner',
        description: 'A gentle morning routine to wake up your body and mind',
        poses: [
          { pose: yogaPoses[0], duration: 30 },
          { pose: yogaPoses[1], duration: 60 },
          { pose: yogaPoses[4], duration: 120 },
          { pose: yogaPoses[5], duration: 30 },
          { pose: yogaPoses[4], duration: 60 }
        ]
      },
      {
        id: 2,
        name: 'Strength Builder',
        duration: 30,
        difficulty: 'intermediate',
        description: 'Build strength and improve balance',
        poses: [
          { pose: yogaPoses[0], duration: 30 },
          { pose: yogaPoses[2], duration: 45 },
          { pose: yogaPoses[3], duration: 30 },
          { pose: yogaPoses[6], duration: 45 },
          { pose: yogaPoses[1], duration: 60 },
          { pose: yogaPoses[4], duration: 60 }
        ]
      },
      {
        id: 3,
        name: 'Relaxation Sequence',
        duration: 20,
        difficulty: 'beginner',
        description: 'A calming sequence to reduce stress and tension',
        poses: [
          { pose: yogaPoses[4], duration: 120 },
          { pose: yogaPoses[6], duration: 45 },
          { pose: yogaPoses[7], duration: 120 },
          { pose: yogaPoses[4], duration: 120 }
        ]
      }
    ];

    const routine = routines.find(r => r.id === routineId);
    
    if (!routine) {
      return res.status(404).json({ error: 'Yoga routine not found' });
    }
    
    res.json({ routine });
  } catch (error) {
    console.error('Get yoga routine error:', error);
    res.status(500).json({ error: 'Failed to get yoga routine' });
  }
});

module.exports = router;
