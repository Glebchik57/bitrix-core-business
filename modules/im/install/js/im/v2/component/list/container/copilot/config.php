<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copilot-container.bundle.css',
	'js' => 'dist/copilot-container.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.public',
		'im.v2.component.list.element-list.copilot',
		'im.v2.const',
		'im.v2.lib.logger',
		'im.v2.provider.service',
	],
	'skip_core' => true,
];