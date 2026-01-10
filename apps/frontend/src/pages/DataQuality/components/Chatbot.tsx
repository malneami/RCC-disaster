import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Send as SendIcon,
  TableChart as TableIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { reportGeneratorService, ReportResponse } from '../../../services/reportGeneratorService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportToXLSX } from '../../../utils/exportUtils';

interface Message {
  type: 'user' | 'assistant' | 'error' | 'system';
  content: string;
  timestamp: Date;
  data?: ReportResponse;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initialize = async () => {
    try {
      setInitializing(true);
      await reportGeneratorService.initialize();
      setInitialized(true);
      addMessage('system', 'Report generator initialized. Ready to answer questions about your data quality metrics.');
    } catch (error: any) {
      addMessage('error', `Failed to initialize: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const addMessage = (type: Message['type'], content: string, data?: ReportResponse) => {
    setMessages((prev) => [
      ...prev,
      {
        type,
        content,
        timestamp: new Date(),
        data,
      },
    ]);
  };

  const handleSend = async () => {
    const userInput = input.trim();
    if (!userInput || loading || !initialized) return;

    // Add user message
    addMessage('user', userInput);
    setInput('');
    setLoading(true);

    try {
      const result = await reportGeneratorService.generateReport(userInput);

      if (result.success) {
        addMessage('assistant', result.report, result);
      } else {
        addMessage('error', result.error || 'Failed to generate report');
      }
    } catch (error: any) {
      addMessage('error', error.message || 'An error occurred while generating the report');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message: Message, index: number) => {
    if (message.type === 'system') {
      return (
        <Box key={index} sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <Alert severity="info" sx={{ width: '100%' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </Alert>
        </Box>
      );
    }

    if (message.type === 'error') {
      return (
        <Box key={index} sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Alert severity="error" sx={{ maxWidth: '80%' }}>
            {message.content}
          </Alert>
        </Box>
      );
    }

    if (message.type === 'user') {
      return (
        <Box key={index} sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              maxWidth: '70%',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="body1">{message.content}</Typography>
          </Paper>
        </Box>
      );
    }

    // Assistant message with data
    return (
      <Box key={index} sx={{ mb: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Paper elevation={1} sx={{ p: 2, maxWidth: '80%', backgroundColor: 'background.paper' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </Paper>
        </Box>

        {message.data && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* SQL Section */}


            {/* Data Preview Section */}
            {message.data.data && message.data.data.length > 0 && (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TableIcon fontSize="small" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Data Preview
                  </Typography>
                  <Chip
                    label={`${message.data.preview_rows} of ${message.data.total_rows} rows`}
                    size="small"
                    variant="outlined"
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    startIcon={<DownloadIcon />}
                    size="small"
                    variant="outlined"
                    onClick={() => exportToXLSX(message.data!.data)}
                  >
                    Export XLSX
                  </Button>
                </Box>
                <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {Object.keys(message.data.data[0]).map((key) => (
                          <TableCell key={key} sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                            {key}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {message.data.data.map((row, rowIndex) => (
                        <TableRow key={rowIndex} hover>
                          {Object.keys(message.data!.data[0]).map((key) => (
                            <TableCell key={key}>
                              {row[key] !== null && row[key] !== undefined ? String(row[key]) : ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    );
  };

  if (initializing) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Initializing report generator...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '80vh' }}>
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: 'grey.50',
          borderRadius: 1,
          mb: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Ask questions about your data quality metrics
            </Typography>
            <Typography variant="body2">
              Try asking questions like:
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
              <Chip label="Show me records with missing patient IDs" size="small" />
              <Chip label="What are the most common data quality issues?" size="small" />
              <Chip label="Which hospitals have the highest data completeness?" size="small" />
            </Box>
          </Box>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder={initialized ? 'Ask a question about your data...' : 'Initializing...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || !initialized}
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || !initialized || !input.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </Box>
    </Box>
  );
};

export default Chatbot;

