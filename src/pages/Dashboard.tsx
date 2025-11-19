import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, DesignRequest } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [requests, setRequests] = useState<DesignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null);
  const [editedStatus, setEditedStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('design_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async () => {
    if (!selectedRequest || !editedStatus) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('design_requests')
        .update({ status: editedStatus })
        .eq('id', selectedRequest.id);

      if (error) {
        console.error('Error updating status:', error);
        alert('Erro ao atualizar status. Verifique suas permissões.');
        return;
      }

      await fetchRequests();
      setSelectedRequest(prev => prev ? { ...prev, status: editedStatus as any } : null);
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status.');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('design_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting request:', error);
        alert('Erro ao excluir solicitação. Verifique suas permissões.');
        return;
      }

      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Erro ao excluir solicitação.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 to-indigo-900">
        <div className="text-white text-2xl">Carregando...</div>
      </div>
    );
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      social_media: 'Social Media',
      print: 'Material Impresso',
      digital: 'Digital / Web',
      branding: 'Branding',
      presentation: 'Apresentação',
      other: 'Outro',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
    };
    return labels[priority] || priority;
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-purple-700 to-indigo-900">
      {/* Header com botão de logout */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Painel de Demandas</h1>
            <p className="text-white/80">Logado como: {user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white">
          <h3 className="text-sm font-medium text-white/80 mb-2">Total</h3>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 text-white">
          <h3 className="text-sm font-medium text-white/80 mb-2">Pendentes</h3>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-6 text-white">
          <h3 className="text-sm font-medium text-white/80 mb-2">Em Andamento</h3>
          <p className="text-3xl font-bold">{stats.in_progress}</p>
        </div>
        <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 text-white">
          <h3 className="text-sm font-medium text-white/80 mb-2">Concluídos</h3>
          <p className="text-3xl font-bold">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === filterOption
                  ? 'bg-white text-purple-700'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {filterOption === 'all' && 'Todos'}
              {filterOption === 'pending' && 'Pendentes'}
              {filterOption === 'in_progress' && 'Em Andamento'}
              {filterOption === 'completed' && 'Concluídos'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center text-white">
              <p className="text-xl">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => {
                  setSelectedRequest(request);
                  setEditedStatus(request.status);
                }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{request.title}</h3>
                    <p className="text-white/80 mb-2">{request.requester_name} • {request.department}</p>
                    <p className="text-white/60 text-sm line-clamp-2">{request.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                      {getPriorityLabel(request.priority)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-white/60">
                  <span>📅 {new Date(request.deadline).toLocaleDateString('pt-BR')}</span>
                  <span>🎨 {getRequestTypeLabel(request.request_type)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de detalhes */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.title}</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
                    <p className="text-gray-900">{selectedRequest.requester_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedRequest.requester_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <p className="text-gray-900">{selectedRequest.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                    <p className="text-gray-900">{new Date(selectedRequest.deadline).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.objective}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Público-alvo</label>
                  <p className="text-gray-900">{selectedRequest.target_audience}</p>
                </div>

                {selectedRequest.additional_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.additional_notes}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={updateRequestStatus}
                    disabled={isSaving || editedStatus === selectedRequest.status}
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    onClick={() => deleteRequest(selectedRequest.id)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;