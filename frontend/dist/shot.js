try {
  localStorage.setItem('ops_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjIsInVzZXJuYW1lIjoidWl0ZXN0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkwMzI5MjIzLCJqdGkiOiJLQ3JqM3ZuaXlNOEFyNTJJTlgyVUt3RlpUWVRaaUhzbSIsImV4cCI6MTc5MDQxNTYyM30.YrvLJDV8v4w9kqhl7xrGpOYpMYcAx4ArZsWHrLZKpSk');
  localStorage.setItem('ops_theme', 'lightgold');
} catch (e) {}
var p = new URLSearchParams(location.search).get('p') || 'dashboard';
location.replace('/#/' + p);