import supabase from '../supabaseClient.js';

export async function getAllContainers(req, res) {
  try {
    const { data, error } = await supabase.from('containers').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export function getHealth(req, res) {
  res.status(200).json({ status: 'ok', service: 'container-service' });
}
