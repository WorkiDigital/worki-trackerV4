const express = require('express');
const router = express.Router();
const TrackingService = require('../services/tracking');

function auth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key !== process.env.API_KEY) return res.status(401).json({ error: 'API Key inválida' });
  next();
}
router.use(auth);

// ═══ PROJETOS ═══
router.get('/projects', async (req, res) => {
  try {
    const projects = await TrackingService.getProjects();
    res.json(projects);
  } catch (err) { console.error('Erro listar projetos:', err); res.status(500).json({ error: 'Erro interno' }); }
});

router.post('/projects', async (req, res) => {
  try {
    const project = await TrackingService.createProject(req.body);
    res.json({ ok: true, project });
  } catch (err) { console.error('Erro criar projeto:', err); res.status(500).json({ error: 'Erro interno' }); }
});

router.put('/projects/:projectId', async (req, res) => {
  try {
    const project = await TrackingService.updateProject(req.params.projectId, req.body);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.json({ ok: true, project });
  } catch (err) { console.error('Erro atualizar projeto:', err); res.status(500).json({ error: 'Erro interno' }); }
});

router.delete('/projects/:projectId', async (req, res) => {
  try {
    const result = await TrackingService.deleteProject(req.params.projectId);
    if (!result) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.json({ ok: true, deleted: result });
  } catch (err) { console.error('Erro excluir projeto:', err); res.status(500).json({ error: 'Erro interno' }); }
});

router.get('/stats', async (req, res) => {
  try {
    const { date_from, date_to, project_id } = req.query;
    const stats = await TrackingService.getStats({ dateFrom: date_from, dateTo: date_to, projectId: project_id });
    res.json(stats);
  } catch (err) { console.error('Erro stats:', err); res.status(500).json({ error: 'Erro interno' }); }
});

router.get('/charts', async (req, res) => {
  try {
    const { date_from, date_to, project_id } = req.query;
    const data = await TrackingService.getChartData({ dateFrom: date_from, dateTo: date_to, projectId: project_id });
    res.json(data);
  } catch (err) { console.error('Erro charts:', err); res.status(500).json({ error: 'Erro interno' }); }
});

router.get('/realtime', async (req, res) => {
  try {
    const { project_id } = req.query;
    const active = await TrackingService.getRealtimeVisitors({ projectId: project_id });
    res.json({ active });
  } catch (err) { console.error('Erro realtime:', err); res.status(500).json({ error: 'Erro interno' }); }
});

router.get('/leads', async (req, res) => {
  try {
    const { page, limit, status, search, sort, order, date_from, date_to, project_id } = req.query;
    const result = await TrackingService.getLeads({
      page: parseInt(page) || 1, limit: Math.min(parseInt(limit) || 50, 100),
      status, search, sort, order, dateFrom: date_from, dateTo: date_to, projectId: project_id
    });
    res.json(result);
  } catch (err) { console.error('Erro leads:', err); res.status(500).json({ error: 'Erro interno' }); }
});

router.get('/leads/:visitorId/journey', async (req, res) => {
  try {
    const j = await TrackingService.getLeadJourney(req.params.visitorId);
    if (!j) return res.status(404).json({ error: 'Lead não encontrado' });
    res.json(j);
  } catch (err) { console.error('Erro journey:', err); res.status(500).json({ error: 'Erro interno' }); }
});

router.post('/leads/:visitorId/convert', async (req, res) => {
  try {
    const { source, value, product, payment } = req.body;
    await TrackingService.processEvents([{
      visitor_id: req.params.visitorId, event: 'conversion',
      data: { source: source || 'manual', value, product, payment }
    }]);
    res.json({ ok: true });
  } catch (err) { console.error('Erro convert:', err); res.status(500).json({ error: 'Erro interno' }); }
});

// ═══ EDITAR LEAD ═══
router.put('/leads/:visitorId', async (req, res) => {
  try {
    const result = await TrackingService.updateLead(req.params.visitorId, req.body);
    if (!result) return res.status(404).json({ error: 'Lead não encontrado' });
    res.json({ ok: true, visitor: result });
  } catch (err) { console.error('Erro update:', err); res.status(500).json({ error: 'Erro interno' }); }
});

// ═══ EXCLUIR UM LEAD ═══
router.delete('/leads/:visitorId', async (req, res) => {
  try {
    const result = await TrackingService.deleteLead(req.params.visitorId);
    if (!result) return res.status(404).json({ error: 'Lead não encontrado' });
    res.json({ ok: true, deleted: result });
  } catch (err) { console.error('Erro delete:', err); res.status(500).json({ error: 'Erro interno' }); }
});

// ═══ EXCLUIR TODOS OS LEADS ═══
router.delete('/leads', async (req, res) => {
  try {
    const confirm = req.headers['x-confirm-delete'];
    if (confirm !== 'DELETAR_TUDO') return res.status(400).json({ error: 'Envie header X-Confirm-Delete: DELETAR_TUDO para confirmar' });
    const result = await TrackingService.deleteAllLeads();
    res.json({ ok: true, ...result });
  } catch (err) { console.error('Erro delete all:', err); res.status(500).json({ error: 'Erro interno' }); }
});

module.exports = router;
