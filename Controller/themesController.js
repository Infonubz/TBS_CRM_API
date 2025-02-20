const pool = require('../config/db')
const fs = require('fs');
const path = require('path');

// CREATE Theme
const createTheme = async (req, res) => {
    try {
        const { title } = req.body;
        const background = req.files && req.files['background'] ? `/theme_files/${req.files['background'][0].filename}` : null;
        const building = req.files && req.files['building'] ? `/theme_files/${req.files['building'][0].filename}` : null;
        const sky = req.files && req.files['sky'] ? `/theme_files/${req.files['sky'][0].filename}` : null;
        const road = req.files && req.files['road'] ? `/theme_files/${req.files['road'][0].filename}` : null;

        const result = await pool.query(
            'INSERT INTO public.themes_tbl (title, background, building, sky, road, status, status_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, background, building, sky, road, 'InActive', 2]
        );
        res.status(201).json({message: 'Theme created successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create theme' });
    }
};

// READ Theme
const getThemes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.themes_tbl');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve themes' });
    }
};

// READ Theme BY Status ID
const getThemesByStatusId = async (req, res) => {
    const statusId = req.params.status_id
    try {
        if (statusId == 0) {
            const result = await pool.query('SELECT * FROM public.themes_tbl');
            res.status(200).json(result.rows);
        } else{
        const result = await pool.query('SELECT * FROM public.themes_tbl WHERE status_id = $1', [statusId]);
        res.status(200).json(result.rows);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve themes' });
    }
};

// READ Theme by ID
const getThemesId = async (req, res) => {
    try {
        const { theme_id } = req.params;
        const result = await pool.query('SELECT * FROM public.themes_tbl WHERE theme_id = $1', [theme_id]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve themes' });
    }
};

// UPDATE Theme
const updateTheme = async (req, res) => {
    try {
        const { theme_id } = req.params;
        const { title, status, status_id } = req.body;
        const background = req.files && req.files['background'] ? `/theme_files/${req.files['background'][0].filename}` : null;
        const building = req.files && req.files['building'] ? `/theme_files/${req.files['building'][0].filename}` : null;
        const sky = req.files && req.files['sky'] ? `/theme_files/${req.files['sky'][0].filename}` : null;
        const road = req.files && req.files['road'] ? `/theme_files/${req.files['road'][0].filename}` : null;

        await pool.query('BEGIN');

        if (status_id === 2) {
            await pool.query(
                'UPDATE public.themes_tbl SET status = $1, status_id = $2, updated_date = now() WHERE theme_id != $3',
                ['Inactive', 3, theme_id]
            );
        }

        const result = await pool.query(
            'UPDATE public.themes_tbl SET title =COALESCE($1, title), background = COALESCE($2, background), building = COALESCE($3, building), sky = COALESCE($4, sky), road = COALESCE($5, road), status = COALESCE($6, status), status_id = COALESCE($7, status_id), updated_date = now() WHERE theme_id = $8 RETURNING *',
            [title, background, building, sky, road, status, status_id, theme_id]
        );

        await pool.query('COMMIT');

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Theme not found' });
        }

        res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Failed to update theme' });
    }
};

// DELETE Theme
const deleteTheme = async (req, res) => {
    try {
        const { theme_id } = req.params;
        const result = await pool.query(
            'DELETE FROM public.themes_tbl WHERE theme_id = $1 RETURNING *',
            [theme_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Theme not found' });
        }
        res.status(200).json({ message: 'Theme deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete theme' });
    }
};

module.exports = {
    createTheme,
    getThemes,
    updateTheme,
    deleteTheme, getThemesId, getThemesByStatusId
};