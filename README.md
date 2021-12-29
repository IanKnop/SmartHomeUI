# Smart Home UI

This is a PHP/JavaScript based user interface for controlling smart home devices via tablet or web browser. Main purpose is the usage as a wall mounted terminal to control lights and thermostats. Due to its modular design it can also be used for other purposes on which interaction with back-end systems should be extended by a responsible user interface. This terminal DOES NOT include any direct interfaces to smart home devices. However it has an adapter for the ioBroker-API and therefore can access all devices that are compatible with that.

Please note that this application is foremostly designed to fulfill my personal needs in this manner. Therefore some features that are important for you might not be included. 

Configuration of the terminal is done by modifying JSON config files, especially the "smarthome.config.default.json" in the root directory. From there you can define different views and functionalities. For a better overview you can divide the files into multiple pieces and include them with the "external"-tag. Included file parts have to be located in a folder named "config" in the root directory.
