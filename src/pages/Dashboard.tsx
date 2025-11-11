import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, DesignRequest } from '../lib/supabase';

const Dashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DesignRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null);
  const [editedStatus, setEditedStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </button>
            <h1 className="text-5xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/80">Acompanhe todas as solicitações de design</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-effect rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-semibold">Total</span>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          </div>

          <div className="glass-effect rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-semibold">Pendentes</span>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{stats.pending}</div>
          </div>

          <div className="glass-effect rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-semibold">Em Andamento</span>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{stats.in_progress}</div>
          </div>

          <div className="glass-effect rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-semibold">Concluídos</span>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{stats.completed}</div>
          </div>
        </div>

        <div className="glass-effect rounded-3xl p-8 mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                filter === 'all' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                filter === 'pending' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pendentes ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                filter === 'in_progress' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Em Andamento ({stats.in_progress})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                filter === 'completed' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Concluídos ({stats.completed})
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredRequests.map((request) => (
            <div key={request.id} className="glass-effect rounded-2xl p-6 card-hover cursor-pointer" onClick={() => setSelectedRequest(request)}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(request.priority)}`}>
                      {getPriorityLabel(request.priority)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      {getRequestTypeLabel(request.request_type)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{request.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{request.description.substring(0, 150)}...</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {request.requester_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {request.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(request.deadline).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                {request.trello_card_url && (
                  <a
                    href={request.trello_card_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-semibold"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.657 1.343 3 3 3h18c1.657 0 3-1.343 3-3V3c0-1.657-1.343-3-3-3zM10.5 18c0 .828-.672 1.5-1.5 1.5H6c-.828 0-1.5-.672-1.5-1.5V6c0-.828.672-1.5 1.5-1.5h3c.828 0 1.5.672 1.5 1.5v12zm9 0c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V6c0-.828.672-1.5 1.5-1.5h3c.828 0 1.5.672 1.5 1.5v12z"/>
                    </svg>
                    Ver no Trello
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="glass-effect rounded-3xl p-12 text-center">
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-xl text-gray-600">Nenhuma solicitação encontrada</p>
          </div>
        )}
      </div>

      {selectedRequest && (() => {
        if (editedStatus === '') {
          setEditedStatus(selectedRequest.status);
        }
        return true;
      })() && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { setSelectedRequest(null); setEditedStatus(''); }}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-gray-800">{selectedRequest.title}</h2>
              <button onClick={() => { setSelectedRequest(null); setEditedStatus(''); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Gerenciar Solicitação</h3>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="completed">Concluído</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  <button
                    onClick={updateRequestStatus}
                    disabled={isSaving || editedStatus === selectedRequest.status}
                    className="px-6 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salvar
                      </>
                    )}
                  </button>
                  {editedStatus === 'completed' && (
                    <button
                      onClick={() => deleteRequest(selectedRequest.id)}
                      className="px-6 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Excluir
                    </button>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Solicitante</h3>
                  <p className="text-gray-800">{selectedRequest.requester_name}</p>
                  <p className="text-gray-600 text-sm">{selectedRequest.requester_email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Departamento</h3>
                  <p className="text-gray-800">{selectedRequest.department}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Tipo</h3>
                  <p className="text-gray-800">{getRequestTypeLabel(selectedRequest.request_type)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Prioridade</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(selectedRequest.priority)}`}>
                    {getPriorityLabel(selectedRequest.priority)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Prazo</h3>
                  <p className="text-gray-800">{new Date(selectedRequest.deadline).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Descrição</h3>
                <p className="text-gray-800 whitespace-pre-line">{selectedRequest.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Objetivo</h3>
                <p className="text-gray-800 whitespace-pre-line">{selectedRequest.objective}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Público-Alvo</h3>
                <p className="text-gray-800">{selectedRequest.target_audience}</p>
              </div>

              {selectedRequest.dimensions && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Dimensões</h3>
                  <p className="text-gray-800">{selectedRequest.dimensions}</p>
                </div>
              )}

              {selectedRequest.color_preferences && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Preferências de Cores</h3>
                  <p className="text-gray-800">{selectedRequest.color_preferences}</p>
                </div>
              )}

              {selectedRequest.reference_images && selectedRequest.reference_images.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Imagens de Referência</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedRequest.reference_images.map((imageUrl, index) => (
                      <a
                        key={index}
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={imageUrl}
                          alt={`Referência ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all cursor-pointer"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.additional_notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notas Adicionais</h3>
                  <p className="text-gray-800 whitespace-pre-line">{selectedRequest.additional_notes}</p>
                </div>
              )}

              {selectedRequest.trello_card_url && (
                <div>
                  <a
                    href={selectedRequest.trello_card_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.657 1.343 3 3 3h18c1.657 0 3-1.343 3-3V3c0-1.657-1.343-3-3-3zM10.5 18c0 .828-.672 1.5-1.5 1.5H6c-.828 0-1.5-.672-1.5-1.5V6c0-.828.672-1.5 1.5-1.5h3c.828 0 1.5.672 1.5 1.5v12zm9 0c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V6c0-.828.672-1.5 1.5-1.5h3c.828 0 1.5.672 1.5 1.5v12z"/>
                    </svg>
                    Abrir Card no Trello
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
