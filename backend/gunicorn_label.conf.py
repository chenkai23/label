bind = "0.0.0.0:5050"
workers = 4
worker_class = 'sync'
timeout = 120
proc_name = "label"
accesslog = "logs/access.log"
errorlog = "logs/error.log"