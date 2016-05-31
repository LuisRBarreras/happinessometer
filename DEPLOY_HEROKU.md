# Heroku Deploy

## Deploy process

login

    heroku login

enter email/password.

Push latest changes in master to heroku

    git push heroku master

Start the app

    heroku ps:scale web=1

Open the app

    heroku open

Logs

    heroku logs --tail

## Others

Add heroku remote

     heroku git:remote -a <app-name>

